import { FIELD_ERRORS } from './validation.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export function isObjectId(value) {
  return typeof value === 'string' && OBJECT_ID.test(value);
}

export function readObjectIdField(input, field, errors) {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === '') {
    errors.push({ field, code: FIELD_ERRORS.REQUIRED });
    return '';
  }
  if (!isObjectId(raw)) {
    errors.push({ field, code: FIELD_ERRORS.INVALID_FORMAT });
    return '';
  }
  return raw;
}

/** Unique member ids. Membership itself is checked by the caller. */
export function readIdListField(input, field, errors) {
  const raw = input[field];
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push({ field, code: FIELD_ERRORS.REQUIRED });
    return [];
  }
  if (raw.some((id) => !isObjectId(id))) {
    errors.push({ field, code: FIELD_ERRORS.INVALID_FORMAT });
    return [];
  }
  const unique = [...new Set(raw)];
  if (unique.length !== raw.length) {
    errors.push({ field, code: FIELD_ERRORS.DUPLICATE });
    return [];
  }
  return unique;
}
