import { rateLimit } from 'express-rate-limit';
import AppError from '../utils/AppError.js';

/** Rate limiting for the authentication routes (SDD 7). */
export function authRateLimiter({ windowMinutes, max }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_req, _res, next) {
      next(
        new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.', {
          reason: 'TOO_MANY_REQUESTS',
        }),
      );
    },
  });
}
