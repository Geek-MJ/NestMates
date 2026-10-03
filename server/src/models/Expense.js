import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../modules/expenses/categories.js';

const { Schema } = mongoose;

const shareSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

// SDD 4: expenses(_id, householdId, payerId, amountCents, date, category, description,
// shares[{userId, amountCents}], createdBy, createdAt)
const expenseSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    payerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true, min: 1 },
    date: { type: String, required: true },
    category: { type: String, required: true, enum: EXPENSE_CATEGORIES },
    description: { type: String, default: null, maxlength: 500 },
    shares: { type: [shareSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

expenseSchema.index({ householdId: 1, createdAt: -1 });

const Expense = mongoose.models.Expense ?? mongoose.model('Expense', expenseSchema);

export default Expense;
