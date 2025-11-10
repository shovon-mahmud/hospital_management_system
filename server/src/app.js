import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import { security } from './middleware/security.js';
import router from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(security);

// API docs (basic)
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'HMS API', version: '1.0.0' }
  },
  apis: []
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK' }));
app.use('/api', router);

app.use(notFound);
app.use(errorHandler);

export default app;
