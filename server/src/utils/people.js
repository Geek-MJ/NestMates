import mongoose from 'mongoose';
import User from '../models/User.js';

function applySession(query, session) {
  return session ? query.session(session) : query;
}

/**
 * Current household members, oldest membership first.
 * `name` is null when the referenced account is no longer a member (SDD 4, "Former member").
 */
export async function loadCurrentMembers(householdId, session) {
  return applySession(User.find({ householdId }).select('name householdId').sort({ createdAt: 1 }), session).lean();
}

export async function loadPeople(ids, session) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map();
  const users = await applySession(
    User.find({ _id: mongoose.trusted({ $in: unique }) }).select('name householdId'),
    session,
  ).lean();
  return new Map(users.map((user) => [String(user._id), user]));
}

export function presentPerson(userId, householdId, people) {
  const user = people.get(String(userId));
  const current = Boolean(user) && String(user.householdId ?? '') === String(householdId);
  return { id: String(userId), name: current ? user.name : null };
}

export function memberIdSet(members) {
  return new Set(members.map((member) => String(member._id)));
}
