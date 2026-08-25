"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxOutboundWorker = exports.chatwootInboundWorker = exports.maxOutboundQueue = exports.chatwootInboundQueue = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
const maxWebhook_1 = require("../handlers/maxWebhook");
const chatwootWebhook_1 = require("../handlers/chatwootWebhook");
const connection = {
    url: config_1.config.redis.url,
};
// Queue for messages coming FROM MAX, going TO Chatwoot
exports.chatwootInboundQueue = new bullmq_1.Queue('chatwoot-inbound', { connection });
// Queue for messages coming FROM Chatwoot, going TO MAX
// Rate limiter setup to respect MAX API 30 RPS limit
exports.maxOutboundQueue = new bullmq_1.Queue('max-outbound', { connection });
// Worker processing MAX -> Chatwoot
exports.chatwootInboundWorker = new bullmq_1.Worker('chatwoot-inbound', async (job) => {
    const { ctxPayload } = job.data;
    await (0, maxWebhook_1.handleMaxToChatwootMessage)(ctxPayload);
}, { connection });
// Worker processing Chatwoot -> MAX
// Limiter: 30 jobs per 1000ms
exports.maxOutboundWorker = new bullmq_1.Worker('max-outbound', async (job) => {
    const { webhookPayload } = job.data;
    await (0, chatwootWebhook_1.handleChatwootToMaxMessage)(webhookPayload);
}, {
    connection,
    limiter: {
        max: 30,
        duration: 1000,
    }
});
exports.chatwootInboundWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed in chatwoot-inbound`, err);
});
exports.maxOutboundWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed in max-outbound`, err);
});
//# sourceMappingURL=index.js.map