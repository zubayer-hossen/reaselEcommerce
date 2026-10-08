import { z } from 'zod';
import { passwordRule } from './auth.validators.js';
import { PERMISSIONS } from '../config/permissions.js';
import { ROLES } from '../models/Admin.js';

const assignableRoles = ROLES.filter((r) => r !== 'owner'); // there is exactly one kind of owner: the seeded one

export const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: passwordRule,
  role: z.enum(assignableRoles).default('admin'),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export const updateAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    role: z.enum(assignableRoles),
    isActive: z.boolean(),
    permissions: z.array(z.enum(PERMISSIONS)),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
