const TelegramApi = require("node-telegram-bot-api");
const token = "5025111280:AAGekOPhDA29afw27pxjOevSqie7cTYQDGA";

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

const chats = new Map();

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/info", description: "Получить информацию о транзакциях" },
    { command: "/add", description: "Добавить" },
  ]);

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    console.log("chatId", chatId, "userId", userId);

    let chat;
    if (chats.has(chatId)) {
      chat = chats.get(chatId);
    } else {
      chat = { state: "WAITING_FOR_ACTION" };
      chats.set(chatId, chat);
    }

    switch (chat.state) {
      case "WAITING_FOR_ACTION": {
        if (text === "/start") {
          bot.sendMessage(chatId, "Добро пожаловать");
        } else if (text === "/add") {
          chat.state = "WAITING_FOR_CATEGORY_SELECT";
          bot.sendMessage(chatId, "Выберите категорию", categories);
        } else {
          bot.sendMessage(chatId, "Неверная команда");
        }

        break;
      }
      case "WAITING_FOR_SUM_ENTER": {
        if (isNumeric(text)) {
          chat.enteredSum = text;
          bot.sendMessage(
            chatId,
            `Платеж добавлен: ${chat.selectedCategory} ${chat.enteredSum}`
          );
          chat.state = "WAITING_FOR_ACTION";
        } else {
          bot.sendMessage(chatId, "Сумма введена некорректно");
        }
        break;
      }
      default: {
        bot.sendMessage(chatId, "Что-то пошло не так");
        chat.state = "WAITING_FOR_ACTION";
      }
    }
  });

  bot.on("callback_query", async (msg) => {
    const category = msg.data;
    const chatId = msg.message.chat.id;
    const chat = chats.get(chatId);

    switch (chat.state) {
      case "WAITING_FOR_CATEGORY_SELECT": {
        chat.selectedCategory = category;
        chat.state = "WAITING_FOR_SUM_ENTER";
        bot.sendMessage(chatId, "Введите сумму");

        break;
      }
      default: {
        console.log("Something went wrong");
      }
    }
  });
};

start();

function isNumeric(str) {
  if (typeof str != "string") return false;
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  );
}
