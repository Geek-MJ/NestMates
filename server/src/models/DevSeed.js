import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Records created by `npm run seed:dev`. The application never reads this
 * collection. It exists so the same command can skip or remove only those rows.
 */
const devSeedSchema = new Schema(
  {
    key: { type: String, required: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    expenseIds: { type: [Schema.Types.ObjectId], default: [] },
    settlementIds: { type: [Schema.Types.ObjectId], default: [] },
    eventIds: { type: [Schema.Types.ObjectId], default: [] },
    taskIds: { type: [Schema.Types.ObjectId], default: [] },
    messageIds: { type: [Schema.Types.ObjectId], default: [] },
    documentIds: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The seed command creates this collection itself. Automatic collection
// creation during model init races with the development connection and
// fails before any household data is written.
devSeedSchema.set('autoCreate', false);
devSeedSchema.index({ key: 1, householdId: 1 }, { unique: true });

const DevSeed = mongoose.models.DevSeed ?? mongoose.model('DevSeed', devSeedSchema);

export const DEV_SEED_KEY = 'household-demo-v1';

export default DevSeed;
