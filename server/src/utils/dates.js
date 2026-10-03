import { FIELD_ERRORS } from './validation.js';

export const DATE_MIN = '2000-01-01';
export const DATE_MAX = '2100-12-31';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function push(errors, field, code) {
  errors.push({ field, code });
}

/** A real calendar date as YYYY-MM-DD, within the supported range. */
export function readDateField(input, field, errors) {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === '') {
    push(errors, field, FIELD_ERRORS.REQUIRED);
    return '';
  }
  if (typeof raw !== 'string' || !DATE_PATTERN.test(raw)) {
    push(errors, field, FIELD_ERRORS.INVALID_FORMAT);
    return '';
  }
  const [, year, month, day] = raw.match(DATE_PATTERN);
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const valid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);
  if (!valid || raw < DATE_MIN || raw > DATE_MAX) {
    push(errors, field, FIELD_ERRORS.INVALID_FORMAT);
    return '';
  }
  return raw;
}

/** Optional HH:mm. An empty value is stored as null. */
export function readOptionalTimeField(input, field, errors) {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string' || !TIME_PATTERN.test(raw)) {
    push(errors, field, FIELD_ERRORS.INVALID_FORMAT);
    return null;
  }
  const [, hours, minutes] = raw.match(TIME_PATTERN);
  if (Number(hours) > 23 || Number(minutes) > 59) {
    push(errors, field, FIELD_ERRORS.INVALID_FORMAT);
    return null;
  }
  return `${hours}:${minutes}`;
}

export function readMonthQuery(value, errors) {
  if (typeof value !== 'string' || !MONTH_PATTERN.test(value)) {
    push(errors, 'month', FIELD_ERRORS.INVALID_FORMAT);
    return '';
  }
  const [, year, month] = value.match(MONTH_PATTERN);
  if (Number(month) < 1 || Number(month) > 12 || Number(year) < 2000 || Number(year) > 2100) {
    push(errors, 'month', FIELD_ERRORS.INVALID_FORMAT);
    return '';
  }
  return value;
}
