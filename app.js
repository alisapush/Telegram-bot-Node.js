const TelegramApi = require("node-telegram-bot-api");
const { Client } = require("pg");
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

async function startBot(db) {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/info", description: "Получить информацию о транзакциях" },
    { command: "/add", description: "Добавить" },
  ]);

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    console.log("chatId = ", chatId, "userId= ", userId);

    let chat;
    if (chats.has(chatId)) {
      chat = chats.get(chatId);
    } else {
      chat = { state: "WAITING_FOR_ACTION" };
      chats.set(chatId, chat);
    }

    try {
      switch (chat.state) {
        case "WAITING_FOR_ACTION": {
          if (text === "/start") {
            bot.sendMessage(chatId, "Добро пожаловать");
            bot.sendSticker(chatId, stickerStart);
          } else if (text === "/add") {
            chat.state = "WAITING_FOR_CATEGORY_SELECT";
            bot.sendMessage(chatId, "Выберите категорию", categories);
          } else if (text === "/info") {
            bot.sendMessage(
              chatId,
              `Уважаваемый пользователь ${msg.from.first_name}! Чтобы посмотреть все транзакции перейдите по ссылке:`
            );
          } else {
            bot.sendMessage(chatId, "Неверная команда");
          }

          break;
        }
        case "WAITING_FOR_SUM_ENTER": {
          if (isNumeric(text)) {
            chat.enteredSum = text;
            chat.currentTime = new Date();
            await db.query({
              text: "insert into payments(user_id, category, amount, datetime) values ($1, $2, $3, $4)",
              values: [
                userId,
                chat.selectedCategory,
                chat.enteredSum,
                chat.currentTime,
              ],
            });

            bot.sendMessage(
              chatId,
              `Платеж добавлен: ${chat.selectedCategory} ${chat.enteredSum}`
            );
            bot.sendSticker(chatId, stickerAdd);
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
    } catch (err) {
      bot.sendMessage(chatId, "Что-то пошло не так");
      chat.state = "WAITING_FOR_ACTION";
      console.error("что-то пошло не так: ", err);
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
}

(async function main() {
  const db = new Client();
  await db.connect();

  const express = require("express");
  const app = express();

  // server css as static
  app.use(express.static(__dirname));

  app.listen(3000, (err) => {
    console.log("app is not listen ", err);
    console.log("app listening");
  });

  app.get("/stats/", async (req, res) => {
    for (let chatIdCurrent of chats.keys()) {
      console.log("chats = ", chatIdCurrent);

      let info = await db.query({
        text: `SELECT user_id, category, amount, datetime FROM payments WHERE user_id = ${chatIdCurrent}`,
      });
      // console.log("info = ", info);

      let trs = "";
      for (let { category, amount, datetime } of info.rows) {
        trs += `<tr> 
        <td>${category}</td>
        <td>${amount}</td>
        <td>${datetime}</td>
      </tr>`;
      }
      res.send(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <link rel="stylesheet" href="style.css">
          <title>Bot statistics</title>
        </head>
        <body>
          <h1>Список транзакций</h1>
          <table>
            <thead>
              <tr>
                <th>Категория</th>
                <th>Сумма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              ${trs}
            <tbody>
          </table>
        </body>
      </html>`);
    }
  });

  startBot(db);
})();

function isNumeric(str) {
  if (typeof str != "string") return false;
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  );
}
