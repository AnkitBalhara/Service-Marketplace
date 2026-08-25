import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { apiRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { swaggerDocument } from './swagger';

export const createApp = (): Express => {
  const app = express();

  // Basic security and parsing middleware
  app.use(helmet({ contentSecurityPolicy: false })); // allow swagger ui
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  // OpenAPI / Swagger Documentation endpoint
  app.use('/api/docs', ...(swaggerUi.serve as any), swaggerUi.setup(swaggerDocument) as any);

  // Root Welcome & Health Endpoint
  app.get('/', (_req, res) => {
    res.json({
      status: 'online',
      message: 'MarketPulse Three-Sided Services Marketplace API is live',
      documentation: '/api/docs',
      apiBase: '/api',
      endpoints: {
        swaggerDocs: '/api/docs',
        services: '/api/catalogue/services',
        categories: '/api/catalogue/categories',
      },
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
