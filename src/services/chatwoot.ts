import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

const client = axios.create({
  baseURL: `${config.chatwoot.baseUrl}/api/v1/accounts/${config.chatwoot.accountId}`,
  headers: {
    'api_access_token': config.chatwoot.apiToken,
  },
});

export async function searchContact(identifier: string) {
  try {
    const res = await client.get(`/contacts/search`, { params: { q: identifier } });
    const contacts = res.data.payload;
    if (contacts && contacts.length > 0) {
      return contacts[0].id; // return contact_id
    }
    return null;
  } catch (err) {
    console.error('Error searching contact in Chatwoot', err);
    return null;
  }
}

export async function createContact(identifier: string, name: string, avatarUrl?: string) {
  try {
    const payload: any = {
      inbox_id: config.chatwoot.inboxId,
      name: name,
      identifier: identifier,
    };
    if (avatarUrl) payload.avatar_url = avatarUrl;
    
    const res = await client.post(`/contacts`, payload);
    return res.data.payload.contact.id;
  } catch (err) {
    console.error('Error creating contact in Chatwoot', err);
    throw err;
  }
}

export async function createConversation(contactId: number, sourceId: string) {
  try {
    const res = await client.post(`/conversations`, {
      inbox_id: config.chatwoot.inboxId,
      contact_id: contactId,
      source_id: sourceId,
    });
    return res.data.id;
  } catch (err) {
    console.error('Error creating conversation in Chatwoot', err);
    throw err;
  }
}

export async function createMessage(
  conversationId: number,
  content: string,
  attachments?: { buffer: Buffer; filename: string; mimetype: string }[]
) {
  try {
    const form = new FormData();
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
  } catch (err) {
    console.error('Error creating message in Chatwoot', err);
    throw err;
  }
}
