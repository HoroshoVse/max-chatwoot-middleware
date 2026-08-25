import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url);

// Store mapping: maxUserId -> chatwootContactId
export async function setContactMapping(maxUserId: string | number, contactId: number) {
  await redis.set(`mapping:contact:${maxUserId}`, contactId);
}

export async function getContactMapping(maxUserId: string | number): Promise<number | null> {
  const id = await redis.get(`mapping:contact:${maxUserId}`);
  return id ? parseInt(id, 10) : null;
}

// Store mapping: maxUserId -> chatwootConversationId
export async function setConversationMapping(maxUserId: string | number, conversationId: number) {
  await redis.set(`mapping:conv:${maxUserId}`, conversationId);
}

export async function getConversationMapping(maxUserId: string | number): Promise<number | null> {
  const id = await redis.get(`mapping:conv:${maxUserId}`);
  return id ? parseInt(id, 10) : null;
}

// Store idempotency key
export async function checkAndSetIdempotency(key: string, ttl: number = 86400): Promise<boolean> {
  const isNew = await redis.set(`idempotency:${key}`, '1', 'EX', ttl, 'NX');
  return isNew === 'OK';
}
