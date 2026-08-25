import express from 'express';
import { Bot, webhookCallback } from '@maxhub/max-bot-api';
import { config } from './config';
import { chatwootInboundQueue, maxOutboundQueue } from './queues';

const app = express();
app.use(express.json());

const bot = new Bot(config.maxBotToken);

// === MAX Webhook Endpoint ===
// Instead of processing synchronously, we queue it
// If we want to use the bot instance for parsing, we can intercept or just queue the raw payload
app.post('/max-webhook', async (req, res) => {
  try {
    const payload = req.body;
    // Basic check
    if (payload.event === 'message_created') {
      await chatwootInboundQueue.add('max-message', { ctxPayload: payload });
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling MAX webhook', err);
    res.status(500).send('Internal Error');
  }
});

// === Chatwoot Webhook Endpoint ===
app.post('/chatwoot-webhook', async (req, res) => {
  try {
    // Optionally: verify x-hub-signature from req.headers['x-hub-signature']
    // using crypto and config.chatwoot.webhookSecret

    const payload = req.body;
    if (payload.event === 'message_created' && payload.message_type === 'outgoing') {
      await maxOutboundQueue.add('chatwoot-message', { webhookPayload: payload });
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling Chatwoot webhook', err);
    res.status(500).send('Internal Error');
  }
});

// === Healthcheck ===
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

app.listen(config.port, () => {
  console.log(`Middleware listening on port ${config.port}`);
  console.log(`Make sure to register the webhook with MAX: POST https://platform-api2.max.ru/subscriptions`);
});
