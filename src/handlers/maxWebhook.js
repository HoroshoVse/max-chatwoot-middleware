"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMaxToChatwootMessage = handleMaxToChatwootMessage;
const max_bot_api_1 = require("@maxhub/max-bot-api");
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../services/db");
const chatwoot_1 = require("../services/chatwoot");
const config_1 = require("../config");
// Reusable Bot instance for downloading files if needed
const bot = new max_bot_api_1.Bot(config_1.config.maxBotToken);
async function handleMaxToChatwootMessage(ctxPayload) {
    const messageId = ctxPayload.message.id;
    const userId = ctxPayload.message.from.id;
    const text = ctxPayload.message.text || '';
    const firstName = ctxPayload.message.from.first_name || 'MAX User';
    const lastName = ctxPayload.message.from.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    // 1. Idempotency check
    const isNew = await (0, db_1.checkAndSetIdempotency)(messageId);
    if (!isNew) {
        console.log(`Duplicate message ${messageId} ignored`);
        return;
    }
    // 2. Identify Contact
    const stringUserId = String(userId);
    let contactId = await (0, db_1.getContactMapping)(stringUserId);
    if (!contactId) {
        // Try to find in Chatwoot by identifier
        contactId = await (0, chatwoot_1.searchContact)(stringUserId);
        if (!contactId) {
            // Create new contact in Chatwoot
            contactId = await (0, chatwoot_1.createContact)(stringUserId, fullName);
        }
        // Save to mapping DB
        await (0, db_1.setContactMapping)(stringUserId, contactId);
    }
    // 3. Identify Conversation
    let conversationId = await (0, db_1.getConversationMapping)(stringUserId);
    if (!conversationId) {
        // Create new conversation in Chatwoot
        conversationId = await (0, chatwoot_1.createConversation)(contactId, `max-${stringUserId}`);
        await (0, db_1.setConversationMapping)(stringUserId, conversationId);
    }
    // 4. Handle Attachments
    const attachmentsToUpload = [];
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
    await (0, chatwoot_1.createMessage)(conversationId, text, attachmentsToUpload);
    console.log(`Message ${messageId} successfully forwarded to Chatwoot`);
}
//# sourceMappingURL=maxWebhook.js.map