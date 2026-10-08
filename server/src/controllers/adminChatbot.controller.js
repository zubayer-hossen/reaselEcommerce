import mongoose from 'mongoose';
import { ChatbotKnowledge } from '../models/ChatbotKnowledge.js';
import { ChatUnanswered } from '../models/ChatUnanswered.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

const ensureId = (id) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID'); };

export const listKnowledge = asyncHandler(async (req, res) => {
  const items = await ChatbotKnowledge.find().sort({ createdAt: -1 });
  res.json({ success: true, message: 'OK', data: { items } });
});

export const createKnowledge = asyncHandler(async (req, res) => {
  const item = await ChatbotKnowledge.create(req.body);
  await logAudit(req, { action: 'chatbot.create', resource: 'ChatbotKnowledge', resourceId: String(item._id), details: item.title });
  res.status(201).json({ success: true, message: 'Saved', data: { item } });
});

export const updateKnowledge = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const item = await ChatbotKnowledge.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Not found');
  Object.assign(item, req.body);
  await item.save();
  await logAudit(req, { action: 'chatbot.update', resource: 'ChatbotKnowledge', resourceId: String(item._id), details: item.title });
  res.json({ success: true, message: 'Saved', data: { item } });
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  const item = await ChatbotKnowledge.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Not found');
  await logAudit(req, { action: 'chatbot.delete', resource: 'ChatbotKnowledge', resourceId: String(item._id), details: item.title });
  res.json({ success: true, message: 'Deleted' });
});

export const listUnanswered = asyncHandler(async (req, res) => {
  const items = await ChatUnanswered.find().sort({ count: -1, lastAt: -1 }).limit(100);
  res.json({ success: true, message: 'OK', data: { items } });
});

export const deleteUnanswered = asyncHandler(async (req, res) => {
  ensureId(req.params.id);
  await ChatUnanswered.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});
