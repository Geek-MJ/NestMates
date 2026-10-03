import { validationError } from '../../utils/AppError.js';
import { readDateField } from '../../utils/dates.js';
import { readIdListField, readObjectIdField } from '../../utils/ids.js';
import { asObject, FIELD_ERRORS, readStringField } from '../../utils/validation.js';
import { DESCRIPTION_MAX_LENGTH, EXPENSE_CATEGORIES, MAX_AMOUNT_CENTS } from './categories.js';

function readAmountCents(input, errors) {
  const raw = input.amountCents;
  if (raw === undefined || raw === null || raw === '') {
    errors.push({ field: 'amountCents', code: FIELD_ERRORS.REQUIRED });
    return 0;
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw)) {
    errors.push({ field: 'amountCents', code: FIELD_ERRORS.INVALID_FORMAT });
    return 0;
  }
  if (raw <= 0) {
    errors.push({ field: 'amountCents', code: FIELD_ERRORS.NOT_POSITIVE });
    return 0;
  }
  if (raw > MAX_AMOUNT_CENTS) {
    errors.push({ field: 'amountCents', code: FIELD_ERRORS.OUT_OF_RANGE });
    return 0;
  }
  return raw;
}

function readCategory(input, errors) {
  const value = readStringField(input, 'category', errors, { maxLength: 40 });
  if (!value) return '';
  if (!EXPENSE_CATEGORIES.includes(value)) {
    errors.push({ field: 'category', code: FIELD_ERRORS.INVALID_FORMAT });
    return '';
  }
  return value;
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
  if (value.length > DESCRIPTION_MAX_LENGTH) {
    errors.push({ field: 'description', code: FIELD_ERRORS.TOO_LONG });
    return null;
  }
  return value;
}

/** FR-EXP-01 / FR-EXP-02. The amount is already in cents (SDD 6.3). */
export function parseExpense(body) {
  const input = asObject(body);
  const errors = [];
  const expense = {
    amountCents: readAmountCents(input, errors),
    payerId: readObjectIdField(input, 'payerId', errors),
    date: readDateField(input, 'date', errors),
    category: readCategory(input, errors),
    description: readDescription(input, errors),
    participantIds: readIdListField(input, 'participantIds', errors),
  };
  if (errors.length > 0) throw validationError(errors);
  return expense;
}

/** The settled amount is computed on the server; only the other member is accepted (SDD 6.1). */
export function parseSettlement(body) {
  const input = asObject(body);
  const errors = [];
  const counterpartId = readObjectIdField(input, 'counterpartId', errors);
  if (errors.length > 0) throw validationError(errors);
  return { counterpartId };
}
