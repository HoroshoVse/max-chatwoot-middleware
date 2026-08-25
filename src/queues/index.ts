import { Queue, Worker } from 'bullmq';
import { config } from '../config';
import { handleMaxToChatwootMessage } from '../handlers/maxWebhook';
import { handleChatwootToMaxMessage } from '../handlers/chatwootWebhook';

const connection = {
  url: config.redis.url,
};

// Queue for messages coming FROM MAX, going TO Chatwoot
export const chatwootInboundQueue = new Queue('chatwoot-inbound', { connection });

// Queue for messages coming FROM Chatwoot, going TO MAX
// Rate limiter setup to respect MAX API 30 RPS limit
export const maxOutboundQueue = new Queue('max-outbound', { connection });

// Worker processing MAX -> Chatwoot
export const chatwootInboundWorker = new Worker('chatwoot-inbound', async (job) => {
  const { ctxPayload } = job.data;
  await handleMaxToChatwootMessage(ctxPayload);
}, { connection });

// Worker processing Chatwoot -> MAX
// Limiter: 30 jobs per 1000ms
export const maxOutboundWorker = new Worker('max-outbound', async (job) => {
  const { webhookPayload } = job.data;
  await handleChatwootToMaxMessage(webhookPayload);
}, { 
  connection,
  limiter: {
    max: 30,
    duration: 1000,
  }
});

chatwootInboundWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed in chatwoot-inbound`, err);
});

maxOutboundWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed in max-outbound`, err);
});
