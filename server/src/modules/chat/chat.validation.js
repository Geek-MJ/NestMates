import { validationError } from '../../utils/AppError.js';
import { asObject, FIELD_ERRORS } from '../../utils/validation.js';

export const MESSAGE_MAX_LENGTH = 1000;

export function parseMessageText(body) {
  const input = asObject(body);
  const raw = input.text;
  if (typeof raw !== 'string') {
    throw validationError([{ field: 'text', code: raw === undefined || raw === null ? FIELD_ERRORS.REQUIRED : FIELD_ERRORS.INVALID_TYPE }]);
  }
  const text = raw.trim();
  if (!text) throw validationError([{ field: 'text', code: FIELD_ERRORS.REQUIRED }]);
  if (text.length > MESSAGE_MAX_LENGTH) {
    throw validationError([{ field: 'text', code: FIELD_ERRORS.TOO_LONG }]);
  }
  return text;
}

const TARGET_LANGUAGES = new Set(['en', 'fr']);

export function parseTargetLanguage(body) {
  const input = asObject(body);
  const raw = input.targetLanguage;
  if (typeof raw !== 'string' || !TARGET_LANGUAGES.has(raw)) {
    throw validationError([{ field: 'targetLanguage', code: FIELD_ERRORS.INVALID_FORMAT }]);
  }
  return raw;
}

export function parseBefore(query) {
  const raw = query?.before;
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string' || Number.isNaN(Date.parse(raw))) {
    throw validationError([{ field: 'before', code: FIELD_ERRORS.INVALID_FORMAT }]);
  }
  return new Date(raw);
}
