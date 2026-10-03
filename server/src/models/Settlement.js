import mongoose from 'mongoose';

const { Schema } = mongoose;

// SDD 4: settlements(_id, householdId, fromUserId, toUserId, amountCents, createdBy, createdAt)
const settlementSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

settlementSchema.index({ householdId: 1, createdAt: -1 });

const Settlement = mongoose.models.Settlement ?? mongoose.model('Settlement', settlementSchema);

export default Settlement;
