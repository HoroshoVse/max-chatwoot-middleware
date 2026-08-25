"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchContact = searchContact;
exports.createContact = createContact;
exports.createConversation = createConversation;
exports.createMessage = createMessage;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("../config");
const client = axios_1.default.create({
    baseURL: `${config_1.config.chatwoot.baseUrl}/api/v1/accounts/${config_1.config.chatwoot.accountId}`,
    headers: {
        'api_access_token': config_1.config.chatwoot.apiToken,
    },
});
async function searchContact(identifier) {
    try {
        const res = await client.get(`/contacts/search`, { params: { q: identifier } });
        const contacts = res.data.payload;
        if (contacts && contacts.length > 0) {
            return contacts[0].id; // return contact_id
        }
        return null;
    }
    catch (err) {
        console.error('Error searching contact in Chatwoot', err);
        return null;
    }
}
async function createContact(identifier, name, avatarUrl) {
    try {
        const payload = {
            inbox_id: config_1.config.chatwoot.inboxId,
            name: name,
            identifier: identifier,
        };
        if (avatarUrl)
            payload.avatar_url = avatarUrl;
        const res = await client.post(`/contacts`, payload);
        return res.data.payload.contact.id;
    }
    catch (err) {
        console.error('Error creating contact in Chatwoot', err);
        throw err;
    }
}
async function createConversation(contactId, sourceId) {
    try {
        const res = await client.post(`/conversations`, {
            inbox_id: config_1.config.chatwoot.inboxId,
            contact_id: contactId,
            source_id: sourceId,
        });
        return res.data.id;
    }
    catch (err) {
        console.error('Error creating conversation in Chatwoot', err);
        throw err;
    }
}
async function createMessage(conversationId, content, attachments) {
    try {
        const form = new form_data_1.default();
        form.append('content', content || '');
        form.append('message_type', 'incoming');
        if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
                form.append('attachments[]', attachment.buffer, {
                    filename: attachment.filename,
                    contentType: attachment.mimetype,
                });
            }
        }
        const res = await client.post(`/conversations/${conversationId}/messages`, form, {
            headers: {
                ...form.getHeaders(),
            },
        });
        return res.data;
    }
    catch (err) {
        console.error('Error creating message in Chatwoot', err);
        throw err;
    }
}
//# sourceMappingURL=chatwoot.js.map