import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { startCampaignScheduler } from './services/campaignScheduler.service.js';

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    if (env.isProd) process.exit(1);
  }
  app.listen(env.port, () => {
    console.log(`[server] listening on :${env.port} (${env.nodeEnv})`);
    startCampaignScheduler();
  });
}

start();
