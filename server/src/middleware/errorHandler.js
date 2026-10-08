import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Turn common Mongoose / JSON errors into clean 4xx responses.
function normalize(err) {
  if (err.statusCode) return err;
  if (err.name === 'CastError') return { statusCode: 400, message: 'Invalid ID or value' };
  if (err.name === 'ValidationError') {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
    return { statusCode: 400, message: 'Validation failed', details };
  }
  if (err.code === 11000) return { statusCode: 409, message: 'This value already exists', details: err.keyValue };
  if (err.type === 'entity.parse.failed') return { statusCode: 400, message: 'Invalid JSON body' };
  return err;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(rawErr, req, res, next) {
  const err = normalize(rawErr);
  const status = err.statusCode || 500;
  const body = {
    success: false,
    message: status === 500 && env.isProd ? 'Something went wrong' : err.message,
  };
  if (err.details) body.details = err.details;
  if (!env.isProd && status === 500) body.stack = rawErr.stack;
  if (status === 500) console.error(rawErr);
  res.status(status).json(body);
}
