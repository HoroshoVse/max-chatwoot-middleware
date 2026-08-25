import { Bot } from '@maxhub/max-bot-api';
import axios from 'axios';
import { checkAndSetIdempotency, getContactMapping, setContactMapping, getConversationMapping, setConversationMapping } from '../services/db';
import { createContact, createConversation, createMessage, searchContact } from '../services/chatwoot';
import { config } from '../config';

// Reusable Bot instance for downloading files if needed
const bot = new Bot(config.maxBotToken);

export async function handleMaxToChatwootMessage(ctxPayload: any) {
  if (!ctxPayload || !ctxPayload.message) {
    console.log('Skipping webhook: No message object found in payload', ctxPayload);
    return;
  }

  const messageId = ctxPayload.message.body?.mid;
  const userId = ctxPayload.message.sender?.user_id;
  const text = ctxPayload.message.body?.text || '';
  const firstName = ctxPayload.message.sender?.first_name || 'MAX User';
  const lastName = ctxPayload.message.sender?.last_name || '';
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
  const maxAttachments = ctxPayload.message.body?.attachments || [];
  const chatwootAttachments = [];
  
  for (const att of maxAttachments) {
    if (att.payload?.url) {
      try {
        const fileUrl = att.payload.url;
        console.log(`Downloading attachment from MAX: ${fileUrl}`);
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        const filename = att.filename || `file_${Date.now()}`;
        let mimetype = 'application/octet-stream';
        if (att.type === 'image') mimetype = 'image/jpeg';
        else if (att.type === 'video') mimetype = 'video/mp4';
        else if (att.type === 'audio') mimetype = 'audio/mpeg';
        
        chatwootAttachments.push({ buffer, filename, mimetype });
      } catch (err) {
        console.error('Error downloading attachment from MAX:', err);
      }
    }
  }

  // 5. Send Message to Chatwoot
  if (conversationId) {
    await createMessage(conversationId, text, chatwootAttachments);
  }
  console.log(`Message ${messageId} successfully forwarded to Chatwoot`);
}
