import { validationError } from '../../utils/AppError.js';
import { readDateField, readMonthQuery, readOptionalTimeField } from '../../utils/dates.js';
import { asObject, FIELD_ERRORS, readStringField } from '../../utils/validation.js';

export const TITLE_MAX_LENGTH = 200;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;

function readTitle(input, errors) {
  return readStringField(input, 'title', errors, { maxLength: TITLE_MAX_LENGTH });
}

function readDescription(input, errors) {
  const raw = input.description;
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') {
    errors.push({ field: 'description', code: FIELD_ERRORS.INVALID_TYPE });
    return null;
  }
  const value = raw.trim();
  if (!value) return null;
  if (value.length > EVENT_DESCRIPTION_MAX_LENGTH) {
    errors.push({ field: 'description', code: FIELD_ERRORS.TOO_LONG });
    return null;
  }
  return value;
}

function parseEventBody(body) {
  const input = asObject(body);
  const errors = [];
  const event = {
    title: readTitle(input, errors),
    date: readDateField(input, 'date', errors),
    time: readOptionalTimeField(input, 'time', errors),
    description: readDescription(input, errors),
  };
  if (errors.length > 0) throw validationError(errors);
  return event;
}

export function parseCreateEvent(body) {
  return parseEventBody(body);
}

export function parseUpdateEvent(body) {
  return parseEventBody(body);
}

export function parseMonth(query) {
  const errors = [];
  const month = readMonthQuery(query?.month, errors);
  if (errors.length > 0) throw validationError(errors);
  return month;
}
