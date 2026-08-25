import Redis from 'ioredis';
export declare const redis: Redis<"legacy">;
export declare function setContactMapping(maxUserId: string | number, contactId: number): Promise<void>;
export declare function getContactMapping(maxUserId: string | number): Promise<number | null>;
export declare function setConversationMapping(maxUserId: string | number, conversationId: number): Promise<void>;
export declare function getConversationMapping(maxUserId: string | number): Promise<number | null>;
export declare function checkAndSetIdempotency(key: string, ttl?: number): Promise<boolean>;
//# sourceMappingURL=db.d.ts.map