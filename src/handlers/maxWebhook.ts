import { Bot } from '@maxhub/max-bot-api';
import axios from 'axios';
import { getContactMapping, setContactMapping, getConversationMapping, setConversationMapping, checkAndSetIdempotency } from '../services/db';
import { searchContact, createContact, createConversation, createMessage } from '../services/chatwoot';
import { config } from '../config';

// Reusable Bot instance for downloading files if needed
const bot = new Bot(config.maxBotToken);

export async function handleMaxToChatwootMessage(ctxPayload: any) {
  if (!ctxPayload || !ctxPayload.message) {
    console.log('Skipping webhook: No message object found in payload', ctxPayload);
    return;
  }

  const messageId = ctxPayload.message.id;
  const userId = ctxPayload.message.from?.id;
  const text = ctxPayload.message.text || '';
  const firstName = ctxPayload.message.from?.first_name || 'MAX User';
  const lastName = ctxPayload.message.from?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  if (!userId) {
    console.log('Skipping webhook: No userId found in payload', ctxPayload);
    return;
  }
  
  // 1. Idempotency check
  const isNew = await checkAndSetIdempotency(messageId);
  if (!isNew) {
    console.log(`Duplicate message ${messageId} ignored`);
    return;
  }

  // 2. Identify Contact
  const stringUserId = String(userId);
  let contactId = await getContactMapping(stringUserId);
  
  if (!contactId) {
    // Try to find in Chatwoot by identifier
    const searchedContactId = await searchContact(stringUserId);
    if (!searchedContactId) {
      // Create new contact in Chatwoot
      contactId = await createContact(stringUserId, fullName);
    } else {
      contactId = searchedContactId;
    }
    // Save to mapping DB
    if (contactId) {
      await setContactMapping(stringUserId, contactId);
    }
  }

  // 3. Identify Conversation
  let conversationId = await getConversationMapping(stringUserId);
  if (!conversationId) {
    if (!contactId) return; // safety check
    // Create new conversation in Chatwoot
    conversationId = await createConversation(contactId, `max-${stringUserId}`);
    if (conversationId) {
      await setConversationMapping(stringUserId, conversationId);
    }
  }

  // 4. Handle Attachments
  const attachmentsToUpload: { buffer: Buffer; filename: string; mimetype: string }[] = [];
  // Basic example for photos (requires Bot File API to download)
  // if (ctxPayload.message.photo) {
  //   const fileId = ctxPayload.message.photo[ctxPayload.message.photo.length - 1].file_id;
  //   const fileLink = await bot.api.getFileLink(fileId); // Example, depending on exact SDK method
  //   const fileResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
  //   attachmentsToUpload.push({
  //     buffer: Buffer.from(fileResponse.data),
  //     filename: `photo_${fileId}.jpg`,
  //     mimetype: 'image/jpeg'
  //   });
  // }

  // 5. Send Message to Chatwoot
  if (conversationId) {
    await createMessage(conversationId, text, attachmentsToUpload);
  }
  console.log(`Message ${messageId} successfully forwarded to Chatwoot`);
}
