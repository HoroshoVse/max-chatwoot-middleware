"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.setContactMapping = setContactMapping;
exports.getContactMapping = getContactMapping;
exports.setConversationMapping = setConversationMapping;
exports.getConversationMapping = getConversationMapping;
exports.checkAndSetIdempotency = checkAndSetIdempotency;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
exports.redis = new ioredis_1.default(config_1.config.redis.url);
// Store mapping: maxUserId -> chatwootContactId
async function setContactMapping(maxUserId, contactId) {
    await exports.redis.set(`mapping:contact:${maxUserId}`, contactId);
}
async function getContactMapping(maxUserId) {
    const id = await exports.redis.get(`mapping:contact:${maxUserId}`);
    return id ? parseInt(id, 10) : null;
}
// Store mapping: maxUserId -> chatwootConversationId
async function setConversationMapping(maxUserId, conversationId) {
    await exports.redis.set(`mapping:conv:${maxUserId}`, conversationId);
}
async function getConversationMapping(maxUserId) {
    const id = await exports.redis.get(`mapping:conv:${maxUserId}`);
    return id ? parseInt(id, 10) : null;
}
// Store idempotency key
async function checkAndSetIdempotency(key, ttl = 86400) {
    const isNew = await exports.redis.set(`idempotency:${key}`, '1', 'EX', ttl, 'NX');
    return isNew === 'OK';
}
//# sourceMappingURL=db.js.map