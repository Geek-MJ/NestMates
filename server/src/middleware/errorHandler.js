import mongoose from 'mongoose';
import AppError, { notFound, serviceUnavailable, validationError } from '../utils/AppError.js';
import logger, { serializeError } from '../utils/logger.js';
import { FIELD_ERRORS } from '../utils/validation.js';

const DATABASE_UNAVAILABLE_ERRORS = new Set([
  'MongoNetworkError',
  'MongoNotConnectedError',
  'MongoServerSelectionError',
  'MongooseServerSelectionError',
]);

export function notFoundHandler(req, _res, next) {
  next(notFound('ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

function toAppError(error) {
  if (error instanceof AppError) return error;

  if (error?.type === 'entity.parse.failed') {
    return new AppError(400, 'VALIDATION_ERROR', 'The request body is not valid JSON', {
      reason: 'INVALID_JSON',
    });
  }
  if (error?.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large', {
      reason: 'PAYLOAD_TOO_LARGE',
    });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return validationError(
      Object.values(error.errors).map((fieldError) => ({
        field: fieldError.path,
        code: fieldError.kind === 'required' ? FIELD_ERRORS.REQUIRED : FIELD_ERRORS.INVALID_FORMAT,
      })),
    );
  }
  if (error instanceof mongoose.Error.CastError) {
    return validationError([{ field: error.path, code: FIELD_ERRORS.INVALID_FORMAT }]);
  }
  if (DATABASE_UNAVAILABLE_ERRORS.has(error?.name) || mongoose.connection.readyState !== 1) {
    return serviceUnavailable('DATABASE_UNAVAILABLE', 'The database is temporarily unavailable');
  }
  return new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

/**
 * Global error handler (SDD 6.5): logs with the request id and never exposes stack traces.
 * Express recognises error handlers by their four parameters, so `_next` must stay.
 */
export function errorHandler(error, req, res, _next) {
  const appError = toAppError(error);
  const context = { requestId: req.id, method: req.method, path: req.path };

  if (appError !== error) {
    if (appError.status >= 500) logger.error('request.failed', { ...context, error: serializeError(error) });
  } else if (appError.status >= 500) {
    logger.warn('request.unavailable', { ...context, code: appError.code, reason: appError.details?.reason });
  }

  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(appError.status).json(appError.toJSON());
}
