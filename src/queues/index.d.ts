import { Queue, Worker } from 'bullmq';
export declare const chatwootInboundQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare const maxOutboundQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare const chatwootInboundWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
export declare const maxOutboundWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
//# sourceMappingURL=index.d.ts.map