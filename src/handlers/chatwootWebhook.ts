import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
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
    const maxAttachments: any[] = [];

    // Process attachments
    const attachments = webhookPayload.attachments || [];
    for (const att of attachments) {
      try {
        const fileUrl = att.data_url;
        console.log(`Downloading attachment from ${fileUrl}`);
        
        // Download file from Chatwoot
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        // Save to temp file
        const ext = att.extension ? `.${att.extension}` : '';
        const tempFilePath = path.join(os.tmpdir(), `chatwoot_att_${Date.now()}${ext}`);
        fs.writeFileSync(tempFilePath, buffer);
        
        // Upload to MAX
        let token;
        if (att.file_type === 'image') {
          const res = await bot.api.upload.image({ source: tempFilePath }) as any;
          // Image response has photos object or token
          token = res.token || (res.photos && (Object.values(res.photos)[0] as any)?.token);
          if (token) {
            maxAttachments.push({ type: 'image', payload: { token } });
          }
        } else {
          const res = await bot.api.upload.file({ source: tempFilePath });
          token = res.token;
          if (token) {
            maxAttachments.push({ type: 'file', payload: { token } });
          }
        }
        
        // Cleanup temp file
        fs.unlinkSync(tempFilePath);
        console.log(`Successfully uploaded attachment to MAX (token: ${token})`);
      } catch (err) {
        console.error('Error processing attachment for MAX:', err);
      }
    }

    // Send text message and/or attachments
    if (content || maxAttachments.length > 0) {
      await bot.api.sendMessageToUser(maxUserId, content || '', { attachments: maxAttachments.length > 0 ? maxAttachments : null });
      console.log(`Successfully sent message to MAX user ${maxUserId}`);
    }
  } catch (err) {
    console.error('Error sending message to MAX', err);
    throw err; // Will be retried by BullMQ
  }
}
