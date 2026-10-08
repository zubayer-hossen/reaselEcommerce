import mongoose from 'mongoose';

// Questions the bot could not answer — so the owner can teach it. Phone-like digit runs are scrubbed before saving.
const chatUnansweredSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // normalised text, groups repeats
  sample: { type: String, required: true },
  count: { type: Number, default: 1 },
  lastAt: { type: Date, default: Date.now },
});
chatUnansweredSchema.index({ lastAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 }); // auto-clean after 90 days

export const ChatUnanswered = mongoose.model('ChatUnanswered', chatUnansweredSchema);
