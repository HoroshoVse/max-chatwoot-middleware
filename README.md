# Интеграция MAX ↔ Chatwoot (Middleware)

Это Middleware-приложение (на Node.js + TypeScript), связывающее мессенджер MAX с Chatwoot.
Оно использует официальную библиотеку `@maxhub/max-bot-api` и реализует защиту от дубликатов сообщений (Idempotency), ограничение скорости запросов к MAX (Rate Limiter 30 RPS) и проксирование вложений.

## Архитектура
1. **MAX Webhook** `POST /max-webhook` -> `chatwoot-inbound` (Queue) -> Chatwoot API (создание Contact, Conversation, Message)
2. **Chatwoot Webhook** `POST /chatwoot-webhook` -> `max-outbound` (Queue, Rate limited) -> MAX API (сообщение пользователю)

## Требования
- Docker & Docker Compose
- Nginx (с настроенным SSL/TLS, например Let's Encrypt). MAX поддерживает webhooks только через HTTPS!

## Инструкция по запуску

1. Склонируйте репозиторий на сервер.
2. Скопируйте `.env.example` в `.env` и заполните свои данные:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Соберите и запустите контейнеры:
   ```bash
   docker-compose up -d --build
   ```
4. Настройте Nginx. Пример конфигурации находится в `nginx.conf`.
   Обязательно установите SSL сертификат (`certbot --nginx -d ...`).
5. **Подписка на Webhook в MAX:**
   После запуска и настройки HTTPS, вам необходимо зарегистрировать webhook в MAX:
   Выполните POST-запрос с вашим токеном:
   ```bash
   curl -X POST https://platform-api2.max.ru/subscriptions \
     -H "Authorization: Bearer YOUR_MAX_BOT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
           "url": "https://middleware.yourdomain.com/max-webhook",
           "update_types": ["message_created"]
         }'
   ```
6. **Подписка на Webhook в Chatwoot:**
   Перейдите в настройки вашего API Inbox в Chatwoot и добавьте Webhook URL:
   `https://middleware.yourdomain.com/chatwoot-webhook`
   Активируйте события "Message Created".

## Структура проекта
- `src/index.ts`: Инициализация Express, HTTP-ручки `POST /max-webhook` и `POST /chatwoot-webhook`.
- `src/queues/index.ts`: Настройка очередей BullMQ для балансировки нагрузки.
- `src/handlers/maxWebhook.ts`: Обработка входящих сообщений от MAX, создание контактов в Chatwoot.
- `src/handlers/chatwootWebhook.ts`: Перехват ответов операторов Chatwoot, отправка в MAX.
- `src/services/db.ts`: Взаимодействие с Redis (mapping пользователей и idempotency).
- `src/services/chatwoot.ts`: API клиент для Chatwoot (создание контакта, бесед).
