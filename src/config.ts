import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  maxBotToken: process.env.MAX_BOT_TOKEN || '',
  chatwoot: {
    baseUrl: process.env.CHATWOOT_BASE_URL || 'https://chatwoot.example.com',
    apiToken: process.env.CHATWOOT_API_TOKEN || '',
    accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
    inboxId: process.env.CHATWOOT_INBOX_ID || '1',
    webhookSecret: process.env.CHATWOOT_WEBHOOK_SECRET || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }
};
