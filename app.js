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

const transactions = [
  // { amount: , category_id: , user_id: },
];

const users = [
  // { user_id: "", last_amount: ""},
];

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/info", description: "Получить информацию о пользователе" },
  ]);

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
      let user = {
        user_id: chatId,
        last_amount: 0,
      };
      users.push(user);

      await bot.sendSticker(chatId, stickerStart);
      return bot.sendMessage(
        chatId,
        "Добро пожаловать в Statistics! Введите сумму:"
      );
    }

    if (isNumeric(text)) {
      let current_user = users.find((user) => user.user_id === chatId);
      current_user.last_amount = Number(text);
      return bot.sendMessage(chatId, "Выберите категорию", categories);
    }

    if (text === "/info") {
      await bot.sendMessage(
        chatId,
        `Вас зовут ${msg.from.first_name} ${msg.from.last_name}`
      );

      let ts = transactions.filter(
        (transaction) => transaction.user_id === chatId
      );
      let mes = JSON.stringify(ts);

      return bot.sendMessage(chatId, `Транзакции: ${mes}`);
    }

    return bot.sendMessage(chatId, "Я Вас не понимаю, попробуйте еще раз!");
  });

  bot.on("callback_query", async (msg) => {
    const category = msg.data;
    console.log(msg);
    const chatId = msg.message.chat.id;

    let current_user = users.find((user) => user.user_id === chatId);

    let transaction = {
      user_id: chatId,
      category_id: category,
      amount: current_user.last_amount,
    };

    transactions.push(transaction);

    await bot.sendMessage(chatId, `Добавлено в категорию ${category}`);
    await bot.sendSticker(chatId, stickerAdd);
    console.log(msg);
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
