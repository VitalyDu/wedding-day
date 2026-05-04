# Свадьба Виталия и Гузаль — приглашение

Статический одностраничный сайт: откройте [`index.html`](index.html) в браузере или поднимите любой HTTP-сервер в корне репозитория.

## Настройка RSVP (Telegram)

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите **токен**.
2. Узнайте **chat_id** чата, куда бот должен писать (например, личный чат с ботом или группа; для группы добавьте бота в группу).
3. В [`assets/script.js`](assets/script.js) задайте константы:

```js
const TELEGRAM_BOT_TOKEN = "1234567890:AAH...";
const TELEGRAM_CHAT_ID = "123456789";
```

Без них форма всё равно покажет «Спасибо», а данные выведутся в консоль браузера (режим разработки).

## Open Graph

Для корректного превью в соцсетях замените в [`index.html`](index.html) `og:image` на **абсолютный** URL после публикации сайта (например `https://ваш-домен.ru/assets/illustrations/doves-rings.webp`).

## Иллюстрации

- Исходники в [`icons/`](icons/) (экспорт из дизайна).
- Оптимизированные WebP для страницы — в [`assets/illustrations/`](assets/illustrations/).
- Дополнительные line-art иконки — в [`assets/icons/`](assets/icons/).

## Стек

HTML5, CSS3, ES6, [AOS](https://michalsnik.github.io/aos/) (CDN), Google Fonts.
