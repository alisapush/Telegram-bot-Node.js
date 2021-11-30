const { Telegraf } = require("telegraf");
// nodemon автоматически перезагружает сервер
const TelegramApi = require("node-telegram-bot-api");
const token = "2057843551:AAGybFyGuz0xrx7p2Eawq3EaU5Kzw56wNjM";

const bot = new TelegramApi(token, { polling: true });

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/info", description: "Получить информацию о пользователе" },
  ]);
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
      await bot.sendSticker(
        chatId,
        "https://tlgrm.ru/_/stickers/51e/d68/51ed68e0-9cee-39cc-bebe-24ea15a45442/5.webp"
      );
      return bot.sendMessage(
        chatId,
        "Добро пожаловать в телеграм-бот Statistics от автора alisapush!"
      );
    }

    if (text === "/info") {
      return bot.sendMessage(
        chatId,
        `Вас зовут ${msg.from.first_name} ${msg.from.last_name}`
      );
    }
  });
};

start();
