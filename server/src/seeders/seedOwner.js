import { z } from 'zod';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { passwordRule } from '../validators/auth.validators.js';

// Usage: set SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD in server/.env, then `npm run seed:owner`
const schema = z.object({
  name: z.string().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: passwordRule,
});

async function run() {
  const parsed = schema.safeParse({
    name: process.env.SEED_OWNER_NAME || 'Owner',
    email: process.env.SEED_OWNER_EMAIL,
    password: process.env.SEED_OWNER_PASSWORD,
  });
  if (!parsed.success) {
    console.error('Invalid SEED_OWNER_* values:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  if (!(await connectDB())) {
    console.error('MONGO_URI is required');
    process.exit(1);
  }
  if (await Admin.exists({ role: 'owner' })) {
    console.log('An owner already exists — nothing to do.');
  } else {
    const owner = new Admin({ name: parsed.data.name, email: parsed.data.email, role: 'owner' });
    await owner.setPassword(parsed.data.password);
    await owner.save();
    console.log(`Owner created: ${owner.email}`);
  }
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
