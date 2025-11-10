import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import env from '../config/env.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) throw createError(401, 'No token provided');

    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = await User.findById(decoded.sub).populate('role');
    if (!req.user) throw createError(401, 'User not found');
    next();
  } catch (err) {
    next(createError(401, 'Unauthorized'));
  }
};

export const roleCheck = (allowed = []) => (req, _res, next) => {
  if (!req.user || !req.user.role || !allowed.includes(req.user.role.name)) {
    return next(createError(403, 'Forbidden'));
  }
  next();
};
