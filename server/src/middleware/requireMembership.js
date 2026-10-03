import mongoose from 'mongoose';
import { isMemberOf } from '../modules/households/membership.js';
import { forbidden } from '../utils/AppError.js';

/**
 * Access control per household (NFR-SEC-03, SDD 3.2). Use after `authenticate` on every
 * `/households/:id/...` route; the membership is read from the database on each request.
 * Sets `req.householdId` for the route handlers.
 */
export async function requireMembership(req, _res, next) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id) || !(await isMemberOf(req.auth.userId, id))) {
    throw forbidden('NOT_HOUSEHOLD_MEMBER', 'You are not a member of this household');
  }
  req.householdId = id;
  next();
}
