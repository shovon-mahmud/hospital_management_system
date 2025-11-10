// Centralized email templates
// Each template returns { html, text }

export const verifyEmailTemplate = ({ name, verifyUrl, expiresInHours = 24 }) => {
  const safeName = name ? escapeHtml(name) : '';
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>Verify Email</title><style>
  body { font-family: system-ui,-apple-system,Segoe UI,Arial,sans-serif; background:#f7f9fc; margin:0; padding:0; }
  .container { max-width:560px; margin:32px auto; background:#ffffff; border-radius:8px; padding:32px; border:1px solid #e2e8f0; }
  h1 { font-size:20px; margin:0 0 16px; color:#0f172a; }
  p { line-height:1.5; color:#334155; }
  a.button { display:inline-block; background:#2563eb; color:#ffffff !important; text-decoration:none; padding:12px 20px; border-radius:6px; font-weight:600; }
  .footer { font-size:12px; color:#64748b; margin-top:32px; }
  </style></head><body><div class="container">
  <h1>Verify your account</h1>
  <p>Hi ${safeName || 'there'},</p>
  <p>Thanks for signing up. Please verify your email address to activate your HMS account.</p>
  <p><a href="${verifyUrl}" class="button" target="_blank" rel="noopener">Verify Account</a></p>
  <p>If the button doesn’t work, copy and paste this URL into your browser:<br><span style="word-break:break-all; font-size:12px;">${verifyUrl}</span></p>
  <p>This link will expire in ${expiresInHours} hours for security.</p>
  <div class="footer">
    <p>If you didn’t create an account, you can safely ignore this email.</p>
  </div>
  </div></body></html>`;
  const text = `Verify your HMS account\n\nHi ${safeName || 'there'},\n\nVisit this link to verify your account (expires in ${expiresInHours} hours):\n${verifyUrl}\n\nIf you did not create an account, ignore this email.`;
  return { html, text };
};

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;' }[c]));
}

export const welcomeEmailTemplate = ({ name, role, appName = 'HMS', dashboardUrl }) => {
  const safeName = name ? escapeHtml(name) : '';
  const roleLine = role ? `<p>Your assigned role: <strong>${escapeHtml(role)}</strong></p>` : '';
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>Welcome</title><style>
  body { font-family: system-ui,-apple-system,Segoe UI,Arial,sans-serif; background:#f7f9fc; margin:0; padding:0; }
  .container { max-width:560px; margin:32px auto; background:#ffffff; border-radius:8px; padding:32px; border:1px solid #e2e8f0; }
  h1 { font-size:22px; margin:0 0 16px; color:#0f172a; }
  p { line-height:1.5; color:#334155; }
  a.button { display:inline-block; background:#16a34a; color:#ffffff !important; text-decoration:none; padding:12px 20px; border-radius:6px; font-weight:600; }
  .small { font-size:12px; color:#64748b; margin-top:28px; }
  </style></head><body><div class="container">
  <h1>Welcome to ${escapeHtml(appName)}</h1>
  <p>Hi ${safeName || 'there'},</p>
  <p>We're excited to have you on board. Your account is now created.</p>
  ${roleLine}
  <p>Get started by visiting your dashboard:</p>
  <p><a href="${dashboardUrl}" class="button" target="_blank" rel="noopener">Open Dashboard</a></p>
  <p>If the button doesn’t work, copy and paste this URL:<br><span style="word-break:break-all; font-size:12px;">${dashboardUrl}</span></p>
  <div class="small">
    <p>If you didn’t expect this email, you can ignore it.</p>
  </div>
  </div></body></html>`;
  const text = `Welcome to ${appName}\n\nHi ${safeName || 'there'},\nYour account is now created.${role ? ` Role: ${role}.` : ''}\nDashboard: ${dashboardUrl}\n\nIf you didn’t expect this email, you can ignore it.`;
  return { html, text };
};

export const loginGreetingTemplate = ({ name, role, appName = 'HMS', when, ip, userAgent, lastLoginAt, dashboardUrl }) => {
  const safeName = name ? escapeHtml(name) : '';
  const diff = lastLoginAt ? timeDiffReadable(lastLoginAt, when) : 'First login';
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>Login Notification</title><style>
  body { font-family: system-ui,-apple-system,Segoe UI,Arial,sans-serif; background:#f8fafc; margin:0; padding:0; }
  .container { max-width:560px; margin:32px auto; background:#ffffff; border-radius:8px; padding:32px; border:1px solid #e2e8f0; }
  h1 { font-size:20px; margin:0 0 16px; color:#0f172a; }
  p { line-height:1.5; color:#334155; }
  code { background:#f1f5f9; padding:2px 4px; border-radius:4px; font-size:12px; }
  a.button { display:inline-block; background:#2563eb; color:#ffffff !important; text-decoration:none; padding:10px 18px; border-radius:6px; font-weight:600; }
  .footer { font-size:12px; color:#64748b; margin-top:28px; }
  </style></head><body><div class="container">
  <h1>Login successful</h1>
  <p>Hi ${safeName || 'there'}, your ${escapeHtml(appName)} account just logged in.</p>
  <p><strong>Role:</strong> ${escapeHtml(role || 'N/A')}<br>
     <strong>Time:</strong> ${new Date(when).toISOString()}<br>
     <strong>IP:</strong> ${escapeHtml(ip || 'unknown')}<br>
     <strong>Client:</strong> ${escapeHtml((userAgent || '').slice(0,140)) || 'Unknown'}<br>
     <strong>Previous login:</strong> ${escapeHtml(diff)}</p>
  <p><a href="${dashboardUrl}" class="button" target="_blank" rel="noopener">Go to Dashboard</a></p>
  <div class="footer">
    <p>If this wasn’t you, reset your password immediately and contact support.</p>
  </div>
  </div></body></html>`;
  const text = `Login successful\n\nUser: ${safeName || 'there'}\nApp: ${appName}\nRole: ${role || 'N/A'}\nTime: ${new Date(when).toISOString()}\nIP: ${ip || 'unknown'}\nClient: ${(userAgent || '').slice(0,140) || 'Unknown'}\nPrevious login: ${diff}\nDashboard: ${dashboardUrl}\nIf this wasn’t you, reset your password.`;
  return { html, text };
};

function timeDiffReadable(prev, now) {
  try {
    const p = new Date(prev).getTime();
    const n = new Date(now).getTime();
    if (!p || !n) return 'Unknown';
    const diffMs = n - p;
    if (diffMs < 60000) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} minute(s) ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour(s) ago`;
    const days = Math.floor(hours / 24);
    return `${days} day(s) ago`;
  } catch { return 'Unknown'; }
}
