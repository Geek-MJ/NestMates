import mongoose from 'mongoose';

const { Schema } = mongoose;

// SDD 4: documents(_id, householdId, fileName, mimeType, size, gridFsFileId, uploadedBy, uploadedAt)
const documentSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    fileName: { type: String, required: true, maxlength: 180 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    gridFsFileId: { type: Schema.Types.ObjectId, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, required: true },
  },
  { timestamps: false },
);

documentSchema.index({ householdId: 1, uploadedAt: -1 });

const Document = mongoose.models.Document ?? mongoose.model('Document', documentSchema);

export default Document;
