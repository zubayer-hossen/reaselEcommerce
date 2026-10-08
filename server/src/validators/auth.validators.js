import { z } from 'zod';

const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/\d/, 'Must contain a number');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email() });

export const resetPasswordSchema = z.object({ token: z.string().min(20), newPassword: password });

export { password as passwordRule };
