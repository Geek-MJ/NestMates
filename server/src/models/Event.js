import mongoose from 'mongoose';

const { Schema } = mongoose;

// SDD 4: events(_id, householdId, title, date, time, description, createdBy, createdAt)
const eventSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: String, required: true },
    time: { type: String, default: null },
    description: { type: String, default: null, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

eventSchema.index({ householdId: 1, date: 1 });

const Event = mongoose.models.Event ?? mongoose.model('Event', eventSchema);

export default Event;
