import mongoose from 'mongoose';
import { localized } from './_shared.js';

// An answer the owner teaches the bot. A customer message that contains any keyword gets this answer.
const chatbotKnowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },     // admin-only label, e.g. "Return policy"
    keywords: { type: [String], validate: (v) => v.length > 0 },
    answer: { type: localized, required: true },
    active: { type: Boolean, default: true },
    hits: { type: Number, default: 0 },                       // how many times it answered a customer
  },
  { timestamps: true }
);
chatbotKnowledgeSchema.index({ active: 1 });

export const ChatbotKnowledge = mongoose.model('ChatbotKnowledge', chatbotKnowledgeSchema);
