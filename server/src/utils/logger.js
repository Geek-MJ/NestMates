// Structured JSON logs (SDD 9). One line per entry so Render's log viewer can parse them.

const LEVEL_ORDER = { info: 0, warn: 1, error: 2, silent: 3 };

let currentLevel = process.env.LOG_LEVEL in LEVEL_ORDER ? process.env.LOG_LEVEL : 'info';

function write(level, message, fields = {}) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel]) return;
  const entry = JSON.stringify({ level, time: new Date().toISOString(), message, ...fields });
  const stream = level === 'info' ? process.stdout : process.stderr;
  stream.write(`${entry}\n`);
}

function redactSecrets(value) {
  return String(value ?? '')
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[redacted]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[redacted]');
}

export function serializeError(error) {
  if (!(error instanceof Error)) return { message: redactSecrets(error) };
  return {
    name: error.name,
    message: redactSecrets(error.message),
    code: error.code,
    stack: redactSecrets(error.stack),
  };
}

const logger = {
  setLevel(level) {
    if (level in LEVEL_ORDER) currentLevel = level;
  },
  isEnabled(level) {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
  },
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
};

export default logger;
