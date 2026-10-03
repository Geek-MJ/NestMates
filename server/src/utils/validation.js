// Server-side input validation helpers (NFR-SEC-05). Only strings are accepted where strings are
// expected, which also rejects MongoDB operator objects such as { "$gt": "" }.

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only uses the first 72 bytes of a password.
export const PASSWORD_MAX_BYTES = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FIELD_ERRORS = Object.freeze({
  REQUIRED: 'REQUIRED',
  INVALID_TYPE: 'INVALID_TYPE',
  TOO_LONG: 'TOO_LONG',
  INVALID_EMAIL: 'INVALID_EMAIL',
  PASSWORD_RULES: 'PASSWORD_RULES',
  MUST_ACCEPT: 'MUST_ACCEPT',
  INVALID_FORMAT: 'INVALID_FORMAT',
  NOT_POSITIVE: 'NOT_POSITIVE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  NOT_MEMBER: 'NOT_MEMBER',
  DUPLICATE: 'DUPLICATE',
});

export function asObject(body) {
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

/**
 * Reads a string field, recording a field error in `errors` when it is missing or invalid.
 * Returns the (trimmed) value, or an empty string when invalid.
 */
export function readStringField(input, field, errors, { maxLength, trim = true } = {}) {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === '') {
    errors.push({ field, code: FIELD_ERRORS.REQUIRED });
    return '';
  }
  if (typeof raw !== 'string') {
    errors.push({ field, code: FIELD_ERRORS.INVALID_TYPE });
    return '';
  }
  const value = trim ? raw.trim() : raw;
  if (!value) {
    errors.push({ field, code: FIELD_ERRORS.REQUIRED });
    return '';
  }
  if (maxLength && value.length > maxLength) {
    errors.push({ field, code: FIELD_ERRORS.TOO_LONG });
    return '';
  }
  return value;
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function readEmailField(input, field, errors) {
  const value = readStringField(input, field, errors, { maxLength: EMAIL_MAX_LENGTH });
  if (!value) return '';
  if (!EMAIL_PATTERN.test(value)) {
    errors.push({ field, code: FIELD_ERRORS.INVALID_EMAIL });
    return '';
  }
  return normalizeEmail(value);
}

/** FR-ACC-01: at least 8 characters, including a letter and a digit. */
export function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN_LENGTH &&
    Buffer.byteLength(password, 'utf8') <= PASSWORD_MAX_BYTES &&
    /\p{L}/u.test(password) &&
    /\d/.test(password)
  );
}

export function readNewPasswordField(input, field, errors) {
  const value = readStringField(input, field, errors, { trim: false });
  if (!value) return '';
  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAX_BYTES) {
    errors.push({ field, code: FIELD_ERRORS.TOO_LONG });
    return '';
  }
  if (!isValidPassword(value)) {
    errors.push({ field, code: FIELD_ERRORS.PASSWORD_RULES });
    return '';
  }
  return value;
}
