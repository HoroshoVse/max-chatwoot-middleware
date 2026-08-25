"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const max_bot_api_1 = require("@maxhub/max-bot-api");
const config_1 = require("./config");
const queues_1 = require("./queues");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const bot = new max_bot_api_1.Bot(config_1.config.maxBotToken);
// === MAX Webhook Endpoint ===
// Instead of processing synchronously, we queue it
// If we want to use the bot instance for parsing, we can intercept or just queue the raw payload
app.post('/max-webhook', async (req, res) => {
    try {
        const payload = req.body;
        // Basic check
        if (payload.event === 'message_created') {
            await queues_1.chatwootInboundQueue.add('max-message', { ctxPayload: payload });
        }
        res.status(200).send('OK');
    }
    catch (err) {
        console.error('Error handling MAX webhook', err);
        res.status(500).send('Internal Error');
    }
});
// === Chatwoot Webhook Endpoint ===
app.post('/chatwoot-webhook', async (req, res) => {
    try {
        // Optionally: verify x-hub-signature from req.headers['x-hub-signature']
        // using crypto and config.chatwoot.webhookSecret
        const payload = req.body;
        if (payload.event === 'message_created' && payload.message_type === 'outgoing') {
            await queues_1.maxOutboundQueue.add('chatwoot-message', { webhookPayload: payload });
        }
        res.status(200).send('OK');
    }
    catch (err) {
        console.error('Error handling Chatwoot webhook', err);
        res.status(500).send('Internal Error');
    }
});
// === Healthcheck ===
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date() });
});
app.listen(config_1.config.port, () => {
    console.log(`Middleware listening on port ${config_1.config.port}`);
    console.log(`Make sure to register the webhook with MAX: POST https://platform-api2.max.ru/subscriptions`);
});
//# sourceMappingURL=index.js.map