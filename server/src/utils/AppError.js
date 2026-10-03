/**
 * Error with an HTTP status and the SDD error format:
 * { "error": { "code", "message", "details" } }
 *
 * `code` is the SDD category the frontend translates (VALIDATION_ERROR, UNAUTHENTICATED, ...).
 * `details.reason` gives a stable, more specific identifier (EMAIL_TAKEN, INVALID_CREDENTIALS, ...)
 * and `details.fields` lists field errors for VALIDATION_ERROR.
 */
export default class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

export function validationError(fields, message = 'The request contains invalid data') {
  return new AppError(400, 'VALIDATION_ERROR', message, { fields });
}

export function badRequest(reason, message) {
  return new AppError(400, 'VALIDATION_ERROR', message, { reason });
}

export function unauthenticated(reason, message = 'Authentication is required') {
  return new AppError(401, 'UNAUTHENTICATED', message, { reason });
}

export function forbidden(reason, message = 'You do not have access to this resource') {
  return new AppError(403, 'FORBIDDEN', message, { reason });
}

export function notFound(reason, message = 'Resource not found') {
  return new AppError(404, 'NOT_FOUND', message, { reason });
}

export function conflict(reason, message) {
  return new AppError(409, 'CONFLICT', message, { reason });
}

export function payloadTooLarge(reason, message) {
  return new AppError(413, 'PAYLOAD_TOO_LARGE', message, { reason });
}

export function unsupportedMedia(reason, message) {
  return new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', message, { reason });
}

export function serviceUnavailable(reason, message) {
  return new AppError(503, 'SERVICE_UNAVAILABLE', message, { reason });
}
