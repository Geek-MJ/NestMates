import { validationError } from '../../utils/AppError.js';
import { LANGUAGES } from '../../utils/language.js';
import {
  FIELD_ERRORS,
  NAME_MAX_LENGTH,
  asObject,
  readEmailField,
  readNewPasswordField,
  readStringField,
} from '../../utils/validation.js';

function throwIfInvalid(errors) {
  if (errors.length > 0) throw validationError(errors);
}

/**
 * PATCH /users/me {name?, email?, language?} (FR-ACC-13, FR-ACC-15).
 * Only the fields that are present are changed. Password and household membership are not
 * accepted here.
 */
export function parseProfileUpdate(body) {
  const input = asObject(body);
  const errors = [];
  const update = {};

  if ('name' in input) {
    update.name = readStringField(input, 'name', errors, { maxLength: NAME_MAX_LENGTH });
  }
  if ('email' in input) {
    update.email = readEmailField(input, 'email', errors);
  }
  if ('language' in input) {
    const language = readStringField(input, 'language', errors, { maxLength: 8 });
    if (language && !LANGUAGES.includes(language)) {
      errors.push({ field: 'language', code: FIELD_ERRORS.INVALID_FORMAT });
    } else if (language) {
      update.language = language;
    }
  }

  if (!('name' in input) && !('email' in input) && !('language' in input)) {
    errors.push({ field: 'body', code: FIELD_ERRORS.REQUIRED });
  }

  throwIfInvalid(errors);
  return update;
}

/** PUT /users/me/password {currentPassword, newPassword} (FR-ACC-14). */
export function parsePasswordChange(body) {
  const input = asObject(body);
  const errors = [];
  const currentPassword = readStringField(input, 'currentPassword', errors, { trim: false });
  const newPassword = readNewPasswordField(input, 'newPassword', errors);
  throwIfInvalid(errors);
  return { currentPassword, newPassword };
}
