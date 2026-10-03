import http from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ConfigError, loadConfig } from './config/env.js';
import { createSocketServer } from './realtime/socketServer.js';
import { createMailer } from './services/mailer.js';
import { createTranslationService } from './services/translationService.js';
import logger, { serializeError } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function loadConfigOrExit() {
  try {
    return loadConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      logger.error('config.invalid', { problems: error.problems });
      process.exit(1);
    }
    throw error;
  }
}

const config = loadConfigOrExit();
const mailer = createMailer(config.smtp);
const translation = createTranslationService({
  apiKey: config.translation.apiKey,
  timeoutMs: config.translation.timeoutMs,
});
const app = createApp({ config, mailer, translation });
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer, { config, translation });

if (!translation.isConfigured) {
  logger.warn('translation.not_configured', {
    detail: 'GOOGLE_TRANSLATE_API_KEY is not set: chat messages are kept in their original language.',
  });
}

if (!mailer.isConfigured) {
  logger.warn('mail.not_configured', {
    detail: 'SMTP_HOST and MAIL_FROM are not set: password reset emails cannot be sent.',
  });
}

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('server.stopping', { signal });

  setTimeout(() => {
    logger.error('server.shutdown_timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    // Closing Socket.IO also closes the HTTP server, which stops accepting new connections.
    await new Promise((resolve) => {
      io.close(() => resolve());
      httpServer.closeIdleConnections();
    });
    mailer.close();
    await disconnectDatabase();
    logger.info('server.stopped');
    process.exit(0);
  } catch (error) {
    logger.error('server.shutdown_failed', { error: serializeError(error) });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandled_rejection', { error: serializeError(reason) });
});

try {
  await connectDatabase(config.mongodbUri);
} catch (error) {
  logger.error('database.connection_failed', { error: serializeError(error) });
  process.exit(1);
}

httpServer.listen(config.port, () => {
  logger.info('server.started', { port: config.port, environment: config.nodeEnv });
});
