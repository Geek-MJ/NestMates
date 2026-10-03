import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TASK_STATUSES = Object.freeze(['TODO', 'DONE']);

// SDD 4: tasks(_id, householdId, title, assigneeId, dueDate, status, createdBy, completedAt)
const taskSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: String, required: true },
    status: { type: String, required: true, enum: TASK_STATUSES, default: 'TODO' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

taskSchema.index({ householdId: 1, dueDate: 1 });

const Task = mongoose.models.Task ?? mongoose.model('Task', taskSchema);

export default Task;
