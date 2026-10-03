import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { unauthenticated } from '../utils/AppError.js';

const ALGORITHM = 'HS256';

/** Signs an access token whose only claim is the user id (`sub`). */
export function signAccessToken(userId, { secret, expiresIn }) {
  return jwt.sign({}, secret, { algorithm: ALGORITHM, expiresIn, subject: String(userId) });
}

/**
 * Verifies an access token and returns the authenticated identity.
 * Shared by the HTTP `authenticate` middleware and the Socket.IO handshake.
 */
export function verifyAccessToken(token, { secret }) {
  if (!token) throw unauthenticated('TOKEN_MISSING');
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthenticated('TOKEN_EXPIRED', 'The session has expired');
    }
    throw unauthenticated('TOKEN_INVALID', 'The access token is invalid');
  }
  if (!mongoose.isValidObjectId(payload.sub)) {
    throw unauthenticated('TOKEN_INVALID', 'The access token is invalid');
  }
  return { userId: payload.sub };
}
