import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

export const security = [
  helmet(),
  xss(),
  hpp(),
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
];
