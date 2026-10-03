import { validationError } from './AppError.js';
import { FIELD_ERRORS } from './validation.js';

export const HISTORY_PAGE_SIZE = 50;

/** Page numbers start at 1. The page size is fixed (SDD 8). */
export function readPage(query) {
  const raw = query?.page ?? '1';
  if (typeof raw !== 'string' || !/^[1-9]\d{0,4}$/.test(raw)) {
    throw validationError([{ field: 'page', code: FIELD_ERRORS.INVALID_FORMAT }]);
  }
  return Number(raw);
}

export function pageResult(items, { page, total }) {
  return {
    items,
    page,
    pageSize: HISTORY_PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
  };
}
