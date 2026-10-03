import morgan from 'morgan';
import logger from '../utils/logger.js';

// HTTP request logs with Morgan (SDD 9), written as JSON lines with the request id.
// Only the path is logged, never the query string or the body.
export const requestLogger = morgan(
  (tokens, req, res) =>
    JSON.stringify({
      level: 'info',
      time: new Date().toISOString(),
      message: 'http.request',
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: Number(tokens.status(req, res)) || null,
      durationMs: Number(tokens['response-time'](req, res)) || null,
    }),
  { skip: () => !logger.isEnabled('info') },
);
