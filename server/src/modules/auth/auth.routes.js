import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { createAuthController } from './auth.controller.js';
import { createAuthService } from './auth.service.js';

// Logging out is handled by the frontend, which deletes the stored JWT (SDD 5): the API is stateless.
export function createAuthRouter({ config, mailer }) {
  const router = Router();
  const controller = createAuthController(createAuthService({ config, mailer }));

  router.use(authRateLimiter(config.rateLimit.auth));
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/forgot-password', controller.forgotPassword);
  router.post('/reset-password', controller.resetPassword);

  return router;
}
