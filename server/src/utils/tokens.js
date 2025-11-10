import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signAccess = (user) => jwt.sign({ sub: user._id, role: user.role?.name }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });
export const signRefresh = (user) => jwt.sign({ sub: user._id }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires });

export const verifyRefresh = (token) => jwt.verify(token, env.jwt.refreshSecret);
