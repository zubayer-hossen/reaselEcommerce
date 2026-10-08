import { createUploadSignature } from '../services/cloudinary.service.js';

export const signUpload = (req, res) => {
  res.json({ success: true, message: 'OK', data: createUploadSignature(req.body.folder) });
};
