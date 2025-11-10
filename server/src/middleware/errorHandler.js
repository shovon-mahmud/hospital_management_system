/* eslint-disable no-unused-vars */
import logger from '../config/logger.js';

export const notFound = (_req, res, _next) => {
  res.status(404).json({ success: false, message: 'Not Found' });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) logger.error(err);
  res.status(status).json({ success: false, message });
};
