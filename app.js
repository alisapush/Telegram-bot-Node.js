const { Telegraf } = require("telegraf");
// nodemon автоматически перезагружает сервер
const TelegramApi = require("node-telegram-bot-api");
const token = "2057843551:AAGybFyGuz0xrx7p2Eawq3EaU5Kzw56wNjM";

const stickerStart =
  "https://tlgrm.ru/_/stickers/51e/d68/51ed68e0-9cee-39cc-bebe-24ea15a45442/5.webp";
const stickerAdd =
  "https://tlgrm.ru/_/stickers/51e/d68/51ed68e0-9cee-39cc-bebe-24ea15a45442/9.webp";

const bot = new TelegramApi(token, { polling: true });

const categories = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "Продукты", callback_data: "ПРОДУКТЫ" },
        { text: "Транспорт", callback_data: "ТРАНСПОРТ" },
      ],
      [
        { text: "Жилье", callback_data: "ЖИЛЬЕ" },
        { text: "Здоровье", callback_data: "ЗДОРОВЬЕ" },
      ],
      [{ text: "Развлечения", callback_data: "РАЗВЛЕЧЕНИЯ" }],
    ],
  }),
};

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/info", description: "Получить информацию о пользователе" },
    { command: "/add", description: "Добавить транзакцию" },
  ]);
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
      await bot.sendSticker(chatId, stickerStart);
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

    if (text === "/add") {
      return bot.sendMessage(chatId, "Выберете категорию", categories);
    }

    return bot.sendMessage(chatId, "Я Вас не понимаю, попробуйте еще раз!");
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;

    await bot.sendSticker(chatId, stickerAdd);

    await bot.sendMessage(chatId, `Добавлено в категорию ${data}`);
    console.log(msg);
  });
};

start();
