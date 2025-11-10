import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Patient from '../models/Patient.js';
import { ok } from '../utils/response.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/tokens.js';
import { sendMail } from '../utils/email.js';
import { verifyEmailTemplate, welcomeEmailTemplate, loginGreetingTemplate } from '../utils/emailTemplates.js';
import { isCodeValid } from '../utils/verificationCode.js';
import env from '../config/env.js';

// Link-based email verification (GET /auth/verify-email?token=...)
export const verifyEmailLink = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) throw createError(400, 'Missing verification token');

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Try to get user email for resend functionality
        try {
          const decoded = jwt.decode(token);
          if (decoded?.sub) {
            const user = await User.findById(decoded.sub).select('email');
            if (user) {
              return res.status(400).json({ 
                success: false, 
                message: 'Verification link expired',
                email: user.email 
              });
            }
          }
        } catch (e) { /* continue without email */ }
        return ok(res, null, 'Verification link expired');
      }
      throw createError(400, 'Invalid verification link');
    }

    const user = await User.findById(payload.sub)
      .select('+verificationCode +verificationCodeExpiry')
      .populate('role');
    if (!user) throw createError(404, 'User not found');
    if (user.isEmailVerified) return ok(res, null, 'Email already verified');

    // Check token matches latest and not expired
    if (user.verificationCode !== token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification link',
        email: user.email 
      });
    }
    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification link expired',
        email: user.email 
      });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    // Send welcome email (best-effort)
    try {
      const dashboardUrl = `${env.frontendUrl.replace(/\/$/, '')}/`;
      const { html, text } = welcomeEmailTemplate({ name: user.name, role: user.role?.name, appName: env.appName, dashboardUrl });
      sendMail({ to: user.email, subject: `Welcome to ${env.appName}`, html, text });
  } catch (e) { /* best-effort email */ }

    return ok(res, null, 'Email verified successfully!');
  } catch (e) { next(e); }
};

// Register and send verification link; return tokens for immediate login (but blocked until verified)
export const register = async (req, res, next) => {
  try {
    const { name, email, password, roleName = 'Patient', patientData } = req.body;

    // Basic validation
    if (!name || !email || !password) throw createError(400, 'Missing required fields');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw createError(400, 'Invalid email format');
    const pwdStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdStrong.test(password)) throw createError(400, 'Weak password: min 8 chars incl upper, lower, number & special char');

    const role = await Role.findOne({ name: roleName });
    if (!role) throw createError(400, 'Invalid role');

    const exists = await User.findOne({ email });
    if (exists) throw createError(409, 'Email already in use');

    const user = await User.create({ name, email, password, role: role._id });

    // Auto-create Patient profile when applicable
    if (role.name === 'Patient') {
      const patientProfile = { user: user._id, ...(patientData || {}) };
      await Patient.create(patientProfile);
    }

    // Create verification link token (24h)
    const verifyToken = jwt.sign(
      { sub: user._id, email: user.email },
      env.jwt.accessSecret,
      { expiresIn: '24h' }
    );
    user.verificationCode = verifyToken;
    user.verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${env.frontendUrl.replace(/\/$/, '')}/verify-email?token=${verifyToken}`;
    const { html, text } = verifyEmailTemplate({ name, verifyUrl, expiresInHours: 24 });
    await sendMail({ to: email, subject: 'Verify your HMS account', html, text });

    // Auto-issue tokens (login is still blocked if unverified)
    const populated = await User.findById(user._id).populate('role');
    const accessToken = signAccess(populated);
    const refreshToken = signRefresh(populated);
    populated.refreshTokens.push({ token: refreshToken });
    await populated.save();

    ok(res, {
      accessToken,
      refreshToken,
      user: { id: populated._id, name: populated.name, email: populated.email, role: populated.role.name }
    }, 'Registered');
  } catch (e) { next(e); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const emailInput = (email || '').toString().trim();
    const passwordInput = (password || '').toString();
    if (!emailInput || !passwordInput) throw createError(400, 'Email and password are required');

    // Case-insensitive, trimmed email lookup to support legacy accounts
    const escaped = emailInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ciEmail = new RegExp(`^${escaped}$`, 'i');
    const user = await User.findOne({ email: ciEmail })
      .select('+password +verificationCode +verificationCodeExpiry')
      .populate('role');
    if (!user) {
      if (env.authDebug) console.warn('[authDebug] Login failed: user not found for', emailInput);
      throw createError(401, 'Invalid credentials');
    }
    const match = await user.comparePassword(passwordInput);
    if (!match) {
      if (env.authDebug) console.warn('[authDebug] Login failed: bad password for', emailInput);
      throw createError(401, 'Invalid credentials');
    }

    // Auto-verify legacy users (no field or never had a link assigned)
    if (user.isEmailVerified === undefined || (user.isEmailVerified === false && (!user.verificationCode || !user.verificationCodeExpiry))) {
      user.isEmailVerified = true;
      await user.save();
    }

    // Block unverified users; auto-resend verification link when missing/expired
    if (user.isEmailVerified === false) {
      const now = new Date();
      const linkExpired = !user.verificationCode || !user.verificationCodeExpiry || now > user.verificationCodeExpiry;

      // Detect legacy 6-digit verification codes and convert to link
      const isLegacyCode = !!user.verificationCode && /^\d{6}$/.test(user.verificationCode);
      if (isLegacyCode || linkExpired) {
        const verifyToken = jwt.sign(
          { sub: user._id, email: user.email },
          env.jwt.accessSecret,
          { expiresIn: '24h' }
        );
        user.verificationCode = verifyToken;
        user.verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        const verifyUrl = `${env.frontendUrl.replace(/\/$/, '')}/verify-email?token=${verifyToken}`;
        const { html, text } = verifyEmailTemplate({ name: user.name, verifyUrl, expiresInHours: 24 });
        sendMail({ to: user.email, subject: 'Verify your HMS account', html, text })
          .catch(err => console.error('Failed to send verification link:', err));
        if (env.authDebug) console.warn('[authDebug] Sent new verification link to', user.email, 'reason:', isLegacyCode ? 'legacy_code' : 'expired_or_missing');
      }
      if (env.authDebug) console.warn('[authDebug] Login blocked: unverified for', user.email);
      throw createError(403, 'Please verify your email before logging in. A verification link has been sent to your inbox.');
    }

    const previousLoginAt = user.lastLoginAt;
    user.lastLoginAt = new Date();
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    if (env.loginGreeting) {
      const when = new Date();
      const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0] || req.ip;
      const userAgent = req.get('user-agent') || '';
      const dashboardUrl = `${env.frontendUrl.replace(/\/$/, '')}/`;
      const { html, text } = loginGreetingTemplate({
        name: user.name,
        role: user.role?.name,
        appName: env.appName,
        when,
        ip,
        userAgent,
        lastLoginAt: previousLoginAt,
        dashboardUrl
      });
      sendMail({ to: user.email, subject: `Logged in to ${env.appName}`, html, text })
        .catch(err => console.error('Login greeting email failed:', err));
    }

    ok(res, {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role.name }
    }, 'Logged in');
  } catch (e) { next(e); }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError(400, 'Missing refresh token');
    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded.sub).populate('role');
    if (!user) throw createError(401, 'Invalid token');
    const exists = user.refreshTokens.some((t) => t.token === refreshToken);
    if (!exists) throw createError(401, 'Invalid token');

    const accessToken = signAccess(user);
    ok(res, { accessToken });
  } catch (e) { next(e); }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: { token: refreshToken } } });
    }
    ok(res, null, 'Logged out');
  } catch (e) { next(e); }
};

// Legacy code-based verification (kept for backward compatibility)
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) throw createError(400, 'Email and verification code required');

    const user = await User.findOne({ email }).select('+verificationCode +verificationCodeExpiry').populate('role');
    if (!user) throw createError(404, 'User not found');
    if (user.isEmailVerified) return ok(res, null, 'Email already verified');

    if (!isCodeValid(code, user.verificationCode, user.verificationCodeExpiry)) {
      throw createError(400, 'Invalid or expired verification code');
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    try {
      const dashboardUrl = `${env.frontendUrl.replace(/\/$/, '')}/`;
      const { html, text } = welcomeEmailTemplate({ name: user.name, role: user.role?.name, appName: env.appName, dashboardUrl });
      await sendMail({ to: user.email, subject: `Welcome to ${env.appName}!`, html, text });
    } catch (e) { console.error('Welcome email failed:', e); }

    ok(res, null, 'Email verified successfully');
  } catch (e) { next(e); }
};

export const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw createError(400, 'Email required');
    const user = await User.findOne({ email }).select('+verificationCode +verificationCodeExpiry');
    if (!user) throw createError(404, 'User not found');
    if (user.isEmailVerified) return ok(res, null, 'Email already verified');

    const verifyToken = jwt.sign(
      { sub: user._id, email: user.email },
      env.jwt.accessSecret,
      { expiresIn: '24h' }
    );
    user.verificationCode = verifyToken;
    user.verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${env.frontendUrl.replace(/\/$/, '')}/verify-email?token=${verifyToken}`;
    const { html, text } = verifyEmailTemplate({ name: user.name, verifyUrl, expiresInHours: 24 });
    await sendMail({ to: user.email, subject: 'Verify your HMS account', html, text });
    ok(res, { email: user.email, expiresInHours: 24 }, 'Verification link resent');
  } catch (e) { next(e); }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return ok(res, null, 'If the email exists, a reset link was sent');
    const token = jwt.sign({ sub: user._id, type: 'reset' }, env.jwt.accessSecret, { expiresIn: '15m' });
    await sendMail({ to: email, subject: 'Reset your HMS password', html: `<p>Reset: <a href="#">${token}</a></p>` });
    ok(res, null, 'Reset email sent');
  } catch (e) { next(e); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.sub).select('+password');
    if (!user) throw createError(400, 'Invalid token');
    user.password = password;
    await user.save();
    ok(res, null, 'Password reset successful');
  } catch (e) { next(e); }
};
