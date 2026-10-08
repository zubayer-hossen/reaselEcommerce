import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({ key: { type: String, unique: true, required: true }, seq: { type: Number, default: 0 } });

// Atomic increment — safe under concurrent orders.
counterSchema.statics.next = async function next(key) {
  const doc = await this.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
};

export const Counter = mongoose.model('Counter', counterSchema);
