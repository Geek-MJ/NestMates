import { unauthenticated } from '../utils/AppError.js';
import { verifyAccessToken } from '../services/tokenService.js';

/**
 * Requires a valid `Authorization: Bearer <JWT>` header (SRS 6.4) and attaches the
 * authenticated identity as `req.auth = { userId }`.
 */
export function authenticate(jwtConfig) {
  return function authenticateRequest(req, _res, next) {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw unauthenticated('TOKEN_MISSING');
    }
    req.auth = verifyAccessToken(token, jwtConfig);
    next();
  };
}
