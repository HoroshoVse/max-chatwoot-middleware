# Интеграция MAX ↔ Chatwoot (Middleware)

Это Middleware-приложение (на Node.js + TypeScript), связывающее мессенджер MAX с Chatwoot.
Оно использует официальную библиотеку `@maxhub/max-bot-api` и реализует защиту от дубликатов сообщений (Idempotency), ограничение скорости запросов к MAX (Rate Limiter 30 RPS) и проксирование вложений.

## Архитектура
1. **MAX Webhook** `POST /max-webhook` -> `chatwoot-inbound` (Queue) -> Chatwoot API (создание Contact, Conversation, Message)
2. **Chatwoot Webhook** `POST /chatwoot-webhook` -> `max-outbound` (Queue, Rate limited) -> MAX API (сообщение пользователю)

## Требования
- Docker & Docker Compose
- Nginx (с настроенным SSL/TLS, например Let's Encrypt). MAX поддерживает webhooks только через HTTPS!

---

## 🛠 Подробная инструкция по запуску и настройке

### Шаг 1. Клонирование репозитория
Склонируйте репозиторий на ваш сервер:
```bash
git clone git@github.com:HoroshoVse/max-chatwoot-middleware.git
cd max-chatwoot-middleware
cp .env.example .env
```

### Шаг 2. Настройка файла `.env` (Где взять все данные)
Откройте файл `.env` (например, через `nano .env`) и заполните его по этой инструкции:

#### MAX Конфигурация
* **`MAX_BOT_TOKEN`**: Токен вашего бота в мессенджере MAX. Его выдает платформа MAX при регистрации бота (в бизнес-профиле ИП/Юрлица).

#### Chatwoot Конфигурация
* **`CHATWOOT_BASE_URL`**: Полный адрес вашего сервера Chatwoot. Например: `https://chatwoot.mydomain.com`. Без слэша на конце!
* **`CHATWOOT_ACCOUNT_ID`**: ID вашего аккаунта в Chatwoot.
  * *Где взять:* Зайдите в Chatwoot. Посмотрите в адресную строку браузера. Вы увидите что-то вроде `.../app/accounts/1/dashboard`. В данном случае **1** — это ваш Account ID.
* **`CHATWOOT_INBOX_ID`**: ID вашего канала (Inbox).
  * *Как создать API Channel:* В Chatwoot перейдите в **Настройки (Settings)** -> **Входящие (Inboxes)** -> **Добавить (Add Inbox)** -> Выберите тип **API Channel**. Задайте ему имя.
  * *Где взять ID:* После создания канала перейдите в его настройки. Посмотрите в адресную строку браузера: `.../app/accounts/1/settings/inboxes/42`. В данном случае **42** — это ваш Inbox ID.
* **`CHATWOOT_API_TOKEN`**: Токен доступа к API Chatwoot (чтобы программа могла отправлять сообщения от имени бота/агента).
  * *Где взять:* В самом низу левого меню Chatwoot нажмите на свою аватарку -> **Настройки профиля (Profile Settings)**. Прокрутите страницу в самый низ до раздела **Access Token**. Скопируйте строку.
* **`CHATWOOT_WEBHOOK_SECRET`**: Секретный ключ для проверки подлинности вебхуков.
  * *Где взять:* В Chatwoot перейдите в **Настройки (Settings)** -> **Webhooks** -> **Добавить Webhook**. 
  * В качестве ссылки укажите адрес, где будет работать это приложение: `https://middleware.yourdomain.com/chatwoot-webhook`. 
  * Выберите события **Message Created** (Создано сообщение). 
  * Сохраните. После этого в списке вебхуков появится токен — это и есть ваш Secret.

*(Примечание: `REDIS_URL` и `PORT` в файле `.env` менять не нужно, если вы используете стандартный docker-compose).*

---

### Шаг 3. Запуск приложения (Docker)
Когда файл `.env` заполнен, выполните команду для запуска:
```bash
docker-compose up -d --build
```
Приложение запустится на порту `3000`.

---

### Шаг 4. Настройка Nginx и HTTPS
MAX API **требует** использования HTTPS для вебхуков. 
1. В репозитории есть пример файла `nginx.conf`. Скопируйте его настройки в вашу конфигурацию Nginx (обычно в `/etc/nginx/sites-available/middleware`).
2. Запросите бесплатный SSL сертификат:
   ```bash
   sudo certbot --nginx -d middleware.yourdomain.com
   ```

---

### Шаг 5. Регистрация Webhook в MAX
Чтобы MAX начал присылать сообщения пользователей в ваше Middleware, вам нужно сказать MAX, куда их отправлять.
Выполните этот CURL запрос из командной строки на вашем компьютере или сервере (замените капс на свои данные):

```bash
curl -X POST https://platform-api2.max.ru/subscriptions \
  -H "Authorization: Bearer ВАШ_MAX_BOT_TOKEN_СЮДА" \
  -H "Content-Type: application/json" \
  -d '{
        "url": "https://middleware.yourdomain.com/max-webhook",
        "update_types": ["message_created"]
      }'
```

🎉 **Готово!** Теперь, если кто-то напишет боту в MAX, сообщение попадет в Chatwoot (в API Channel), а ответ оператора вернется пользователю в MAX.
