const DURATION_PATTERN = /^\d+\s*(ms|s|m|h|d|w|y)?$/i;
const LOG_LEVELS = ['info', 'warn', 'error', 'silent'];

export class ConfigError extends Error {
  constructor(problems) {
    super(`Invalid configuration:\n- ${problems.join('\n- ')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

function readString(env, name) {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function readInteger(env, name, fallback, problems, { min = 0 } = {}) {
  const raw = readString(env, name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    problems.push(`${name} must be an integer greater than or equal to ${min}`);
    return fallback;
  }
  return value;
}

function readOrigin(env, name, fallback, problems) {
  const raw = readString(env, name) || fallback;
  if (!raw) {
    problems.push(`${name} is required`);
    return '';
  }
  try {
    const url = new URL(raw);
    if (url.origin === 'null') throw new Error('opaque origin');
    return url.origin;
  } catch {
    problems.push(`${name} must be an origin such as https://nestmates.example`);
    return '';
  }
}

/**
 * Reads and validates the configuration from environment variables.
 * Throws a ConfigError listing every problem so the server never starts half-configured.
 */
export function loadConfig(env = process.env) {
  const problems = [];
  const nodeEnv = readString(env, 'NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  const mongodbUri = readString(env, 'MONGODB_URI');
  if (!mongodbUri) problems.push('MONGODB_URI is required');

  const jwtSecret = readString(env, 'JWT_SECRET');
  if (!jwtSecret) problems.push('JWT_SECRET is required');
  else if (jwtSecret.length < 32) problems.push('JWT_SECRET must contain at least 32 characters');

  const jwtExpiresIn = readString(env, 'JWT_EXPIRES_IN') || '24h';
  if (!DURATION_PATTERN.test(jwtExpiresIn)) {
    problems.push('JWT_EXPIRES_IN must be a duration such as 24h');
  }

  const frontendOrigin = readOrigin(
    env,
    'FRONTEND_ORIGIN',
    isProduction ? '' : 'http://localhost:5173',
    problems,
  );

  const smtpHost = readString(env, 'SMTP_HOST');
  const smtpPort = readInteger(env, 'SMTP_PORT', 587, problems, { min: 1 });
  const smtpUser = readString(env, 'SMTP_USER');
  const smtpPassword = readString(env, 'SMTP_PASSWORD');
  const mailFrom = readString(env, 'MAIL_FROM');
  if (smtpHost && !mailFrom) problems.push('MAIL_FROM is required when SMTP_HOST is set');
  if (smtpUser && !smtpPassword) problems.push('SMTP_PASSWORD is required when SMTP_USER is set');

  const translationTimeoutMs = readInteger(env, 'TRANSLATION_TIMEOUT_MS', 1500, problems, { min: 1 });

  const logLevel = readString(env, 'LOG_LEVEL') || 'info';
  if (!LOG_LEVELS.includes(logLevel)) {
    problems.push(`LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}`);
  }

  const config = {
    nodeEnv,
    isProduction,
    port: readInteger(env, 'PORT', 3000, problems, { min: 0 }),
    trustProxy: readInteger(env, 'TRUST_PROXY', 0, problems),
    logLevel,
    mongodbUri,
    frontendOrigin,
    jwt: {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    },
    translation: {
      apiKey: readString(env, 'GOOGLE_TRANSLATE_API_KEY'),
      timeoutMs: translationTimeoutMs,
    },
    smtp: {
      configured: Boolean(smtpHost && mailFrom),
      host: smtpHost,
      port: smtpPort,
      secure: readString(env, 'SMTP_SECURE') ? readString(env, 'SMTP_SECURE') === 'true' : smtpPort === 465,
      user: smtpUser,
      password: smtpPassword,
      from: mailFrom,
    },
    rateLimit: {
      auth: {
        windowMinutes: readInteger(env, 'AUTH_RATE_LIMIT_WINDOW_MINUTES', 15, problems, { min: 1 }),
        max: readInteger(env, 'AUTH_RATE_LIMIT_MAX', 20, problems, { min: 1 }),
      },
    },
  };

  if (problems.length > 0) throw new ConfigError(problems);
  return Object.freeze(config);
}
