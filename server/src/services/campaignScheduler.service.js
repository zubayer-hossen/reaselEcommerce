import { Campaign } from '../models/Campaign.js';
import { sendCampaignById } from '../controllers/campaigns.controller.js';

let timer;
let running = false;

export async function processScheduledCampaigns() {
  if (running) return;
  running = true;
  try {
    const due = await Campaign.find({ status: 'scheduled', scheduledAt: { $lte: new Date() } }).sort({ scheduledAt: 1 }).limit(5).select('_id');
    for (const campaign of due) {
      try {
        await sendCampaignById(campaign._id, { req: { ip: 'system' } });
      } catch (error) {
        console.error(`[campaign:scheduler] ${campaign._id}:`, error.message);
      }
    }
  } finally {
    running = false;
  }
}

export function startCampaignScheduler() {
  if (timer) return;
  timer = setInterval(() => { processScheduledCampaigns().catch((error) => console.error('[campaign:scheduler]', error.message)); }, 60_000);
  timer.unref?.();
  processScheduledCampaigns().catch((error) => console.error('[campaign:scheduler]', error.message));
}
