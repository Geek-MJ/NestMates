import { randomUUID } from 'node:crypto';

const INCOMING_ID_PATTERN = /^[\w.-]{1,128}$/;

/** Gives every request an id (reusing a well-formed X-Request-Id from the proxy) for log correlation. */
export function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && INCOMING_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
