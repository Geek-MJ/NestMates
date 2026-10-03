import mongoose from 'mongoose';
import { INVITATION_CODE_PATTERN } from '../modules/households/invitationCode.js';
import { NAME_MAX_LENGTH } from '../utils/validation.js';

const { Schema } = mongoose;

// SDD 4: households(_id, name, invitationCode, createdAt). Members are the users whose
// householdId references the household.
const householdSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: NAME_MAX_LENGTH },
    invitationCode: {
      type: String,
      required: true,
      unique: true,
      match: INVITATION_CODE_PATTERN,
    },
  },
  { timestamps: true },
);

export function toPublicHousehold(household) {
  return {
    id: String(household._id),
    name: household.name,
    invitationCode: household.invitationCode,
    createdAt: household.createdAt,
  };
}

const Household = mongoose.models.Household ?? mongoose.model('Household', householdSchema);

export default Household;
