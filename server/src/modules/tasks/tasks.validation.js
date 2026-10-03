import { validationError } from '../../utils/AppError.js';
import { readDateField } from '../../utils/dates.js';
import { readObjectIdField } from '../../utils/ids.js';
import { asObject, FIELD_ERRORS, readStringField } from '../../utils/validation.js';

export const TASK_TITLE_MAX_LENGTH = 200;

export function parseCreateTask(body) {
  const input = asObject(body);
  const errors = [];
  const task = {
    title: readStringField(input, 'title', errors, { maxLength: TASK_TITLE_MAX_LENGTH }),
    assigneeId: readObjectIdField(input, 'assigneeId', errors),
    dueDate: readDateField(input, 'dueDate', errors),
  };
  if (errors.length > 0) throw validationError(errors);
  return task;
}

/** SDD 5: the only update is marking a task done. */
export function parseTaskStatus(body) {
  const input = asObject(body);
  if (input.status !== 'DONE') {
    throw validationError([{ field: 'status', code: FIELD_ERRORS.INVALID_FORMAT }]);
  }
  return { status: 'DONE' };
}
