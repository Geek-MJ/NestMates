import { validationError } from '../../utils/AppError.js';
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

/** POST /auth/register {name, email, password, acceptPrivacy} (FR-ACC-01, FR-ACC-02). */
export function parseRegistration(body) {
  const input = asObject(body);
  const errors = [];
  const name = readStringField(input, 'name', errors, { maxLength: NAME_MAX_LENGTH });
  const email = readEmailField(input, 'email', errors);
  const password = readNewPasswordField(input, 'password', errors);
  if (input.acceptPrivacy !== true) {
    errors.push({ field: 'acceptPrivacy', code: FIELD_ERRORS.MUST_ACCEPT });
  }
  throwIfInvalid(errors);
  return { name, email, password };
}

/** POST /auth/login {email, password}. Only presence and type are checked here. */
export function parseLogin(body) {
  const input = asObject(body);
  const errors = [];
  const email = readEmailField(input, 'email', errors);
  const password = readStringField(input, 'password', errors, { trim: false });
  throwIfInvalid(errors);
  return { email, password };
}

/** POST /auth/forgot-password {email}. */
export function parseForgotPassword(body) {
  const errors = [];
  const email = readEmailField(asObject(body), 'email', errors);
  throwIfInvalid(errors);
  return { email };
}

/** POST /auth/reset-password {token, password}. */
export function parseResetPassword(body) {
  const input = asObject(body);
  const errors = [];
  const token = readStringField(input, 'token', errors, { maxLength: 128 });
  const password = readNewPasswordField(input, 'password', errors);
  throwIfInvalid(errors);
  return { token, password };
}
