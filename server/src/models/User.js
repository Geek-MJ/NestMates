import mongoose from 'mongoose';
import { LANGUAGES } from '../utils/language.js';
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH } from '../utils/validation.js';

const { Schema } = mongoose;

// SDD 4: users(_id, name, email, passwordHash, householdId, language, privacyAcceptedAt,
// resetTokenHash, resetTokenExpiresAt, createdAt). Membership lives on the user, so a user
// belongs to at most one household.
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: NAME_MAX_LENGTH },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: EMAIL_MAX_LENGTH,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', default: null, index: true },
    language: { type: String, enum: LANGUAGES, required: true },
    privacyAcceptedAt: { type: Date, required: true },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.index(
  { resetTokenHash: 1 },
  { partialFilterExpression: { resetTokenHash: { $type: 'string' } } },
);

/** The only representation of a user that leaves the API. */
export function toPublicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    language: user.language,
    householdId: user.householdId ? String(user.householdId) : null,
  };
}

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export default User;
