import { asyncHandler } from '../utils/asyncHandler.js';
import { answer } from '../services/chatbot.service.js';

// POST /api/chatbot/message { message, lang } — stateless; the browser keeps the conversation.
export const message = asyncHandler(async (req, res) => {
  const reply = await answer(req.body);
  res.json({ success: true, message: 'OK', data: { reply } });
});
