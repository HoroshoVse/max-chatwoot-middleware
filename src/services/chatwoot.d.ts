export declare function searchContact(identifier: string): Promise<any>;
export declare function createContact(identifier: string, name: string, avatarUrl?: string): Promise<any>;
export declare function createConversation(contactId: number, sourceId: string): Promise<any>;
export declare function createMessage(conversationId: number, content: string, attachments?: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
}[]): Promise<any>;
//# sourceMappingURL=chatwoot.d.ts.map