import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createHouseholdsRouter } from './modules/households/households.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createTranslationService } from './services/translationService.js';
import logger from './utils/logger.js';

/**
 * Builds the Express application (SDD 3.2): one router per feature module under /api.
 * Dependencies are passed in so the server and the tests share the same wiring.
 */
export function createApp({ config, mailer, translation = createTranslationService() }) {
  logger.setLevel(config.logLevel);

  const app = express();
  app.set('trust proxy', config.trustProxy);
  app.set('etag', false);

  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Accept-Language', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  api.use('/health', createHealthRouter());
  api.use('/auth', createAuthRouter({ config, mailer }));
  api.use('/users', createUsersRouter({ config }));
  api.use('/households', createHouseholdsRouter({ config, translation }));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
