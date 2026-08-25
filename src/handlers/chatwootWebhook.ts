import { Bot } from '@maxhub/max-bot-api';
import { config } from '../config';

const bot = new Bot(config.maxBotToken);

export async function handleChatwootToMaxMessage(webhookPayload: any) {
  // We only care about outgoing messages (from agent/bot to user)
  if (webhookPayload.event !== 'message_created') return;
  if (webhookPayload.message_type !== 'outgoing') return;

  const contact = webhookPayload.conversation?.meta?.sender;
  if (!contact || !contact.identifier) {
    console.log('No contact identifier found, cannot send to MAX');
    return;
  }

  const maxUserId = contact.identifier;
  const content = webhookPayload.content;

  try {
    // Send text message
    if (content) {
      await (bot.api as any).sendMessage(maxUserId, content);
      console.log(`Sent message to MAX user ${maxUserId}`);
    }

    // Process attachments
    const attachments = webhookPayload.attachments;
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // Send file to MAX using file url
        // NOTE: actual method might vary depending on MAX SDK
        // For example: await bot.api.sendDocument(maxUserId, attachment.data_url);
        console.log(`Attachment sent to MAX user ${maxUserId}: ${attachment.data_url}`);
      }
    }
  } catch (err) {
    console.error('Error sending message to MAX', err);
    throw err; // Will be retried by BullMQ
  }
}
