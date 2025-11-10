import dotenv from 'dotenv';

dotenv.config();

// Dev-friendly defaults for local running if secrets are missing
const isDev = (process.env.NODE_ENV || 'development') === 'development';
const accessSecret = process.env.JWT_ACCESS_SECRET || (isDev ? 'dev-access-secret' : undefined);
const refreshSecret = process.env.JWT_REFRESH_SECRET || (isDev ? 'dev-refresh-secret' : undefined);

if ((!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) && isDev) {
  // eslint-disable-next-line no-console
  console.warn('[env] Using fallback dev JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in server/.env for security.');
}

const env = {
  node: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hms',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  appName: process.env.APP_NAME || 'HMS',
  supportEmail: process.env.SUPPORT_EMAIL,
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'HMS <no-reply@hms.local>',
  },
  loginNotify: /^true$/i.test(process.env.LOGIN_NOTIFY || ''),
  loginGreeting: process.env.LOGIN_GREETING ? /^true$/i.test(process.env.LOGIN_GREETING) : true,
  authDebug: /^true$/i.test(process.env.AUTH_DEBUG || ''),
  aws: {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  redisUrl: process.env.REDIS_URL,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8080').split(',')
};

export default env;
