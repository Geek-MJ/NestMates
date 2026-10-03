import mongoose from 'mongoose';

const { Schema } = mongoose;

// SDD 4: messages(_id, householdId, senderId, originalText, sourceLang, translatedText, translatedLang, createdAt)
const messageSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalText: { type: String, required: true, maxlength: 1000 },
    sourceLang: { type: String, default: null },
    translatedText: { type: String, default: null },
    translatedLang: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ householdId: 1, createdAt: -1 });

const Message = mongoose.models.Message ?? mongoose.model('Message', messageSchema);

export default Message;
