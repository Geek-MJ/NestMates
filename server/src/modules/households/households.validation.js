import { validationError } from '../../utils/AppError.js';
import { FIELD_ERRORS, NAME_MAX_LENGTH, asObject, readStringField } from '../../utils/validation.js';
import { INVITATION_CODE_LENGTH, normalizeInvitationCode } from './invitationCode.js';

const TYPED_CODE_PATTERN = new RegExp(`^[A-Z0-9]{${INVITATION_CODE_LENGTH}}$`);

/** POST /households {name} (FR-ACC-05). */
export function parseCreateHousehold(body) {
  const errors = [];
  const name = readStringField(asObject(body), 'name', errors, { maxLength: NAME_MAX_LENGTH });
  if (errors.length > 0) throw validationError(errors);
  return { name };
}

/** POST /households/join {invitationCode} (FR-ACC-08). */
export function parseJoinHousehold(body) {
  const errors = [];
  const raw = readStringField(asObject(body), 'invitationCode', errors, { maxLength: 32 });
  const invitationCode = raw ? normalizeInvitationCode(raw) : '';
  if (raw && !TYPED_CODE_PATTERN.test(invitationCode)) {
    errors.push({ field: 'invitationCode', code: FIELD_ERRORS.INVALID_FORMAT });
  }
  if (errors.length > 0) throw validationError(errors);
  return { invitationCode };
}
