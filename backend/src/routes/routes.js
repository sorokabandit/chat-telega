const { sequelize, User, RefreshToken, Message } = require("../../config/db");
const { Bot } = require("grammy");
const { getIo } = require("../socket.js");

const ACCESS_TOKEN_SECRET = "supersecret_access";
const REFRESH_TOKEN_SECRET = "supersecret_refresh";
const token = "7784918836:AAHrlTQy1xaCBLMf5t025oFSysEZrP7nSBM";
const chatId = "-1002731194100"; // ID канала или чата, куда будут отправляться сообщения

const bot = new Bot(token);
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

bot.start().catch((err) => console.error("Bot startup error:", err));

// Функция для создания уникального ID комнаты
function createRoomId(userId) {
  return `chat-${userId}`;
}

// Обработка входящих сообщений из Telegram
bot.on("message:text", async (ctx) => {
  const telegramChatId = ctx.chat.id.toString();
  const messageText = ctx.message.text;
  const threadId = ctx.message.message_thread_id?.toString();

  const io = getIo();
  if (!io) {
    console.error('Ошибка: io не доступно в обработчике Telegram');
    return;
  }

  // Находим пользователя по threadId
  const user = await User.findOne({ where: { threadId } });
  if (!user) {
    console.log(`No user found for threadId ${threadId}`);
    return;
  }

  // Создаём сообщение в базе данных
  const message = await Message.create({
    content: messageText,
    user: `telegram-${telegramChatId}`,
    userId: user.id,
  });

  // Отправляем сообщение в комнату пользователя
  const roomId = createRoomId(user.id);

  io.to(roomId).emit("newMessage", {
    id: message.id,
    content: message.content,
    user: message.user,
    //timestamp: message.createdAt.toISOString(),
  });

  // Отправляем в комнату админа
  io.to("admin-room").emit("adminMessage", {
    roomId,
    id: message.id,
    content: message.content,
    user: message.user,
    //timestamp: message.createdAt.toISOString(),
  });

  // Логируем для админа
  console.log(
    `[Admin Log] Telegram (${telegramChatId}) -> User ${user.id}: ${messageText}`
  );
});

// Обработчики запросов
const root = {
  users: async () => await User.findAll(),
  user: async ({ id }) => await User.findByPk(id),
  deleteUser: async ({ id }) => {
    const user = await User.findByPk(id);
    if (user) {
      await user.destroy();
      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }
    return null;
  },

  register: async ({ email, password }) => {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });

    const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m", // Краткосрочный access токен
    });

    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d", // Долгосрочный refresh токен
    });

    // Сохраняем refresh токен в базе данных
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
    });

    return { accessToken, refreshToken, user };
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("No user found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid password");

    const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    // Сохраняем refresh токен в базе данных
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken, user };
  },

  refreshToken: async ({ refreshToken }) => {
    // Проверяем refresh токен
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new Error("Invalid refresh token");
    }

    // Проверяем, существует ли refresh токен в базе данных
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken, userId: decoded.userId },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error("Refresh token expired or invalid");
    }

    // Генерируем новый access токен
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken, refreshToken };
  },

  logout: async (args, context) => {
    try {
      const userId = context.user?.id;
      if (!userId) {
        console.log("logout: Not authenticated");
        throw new Error("Not authenticated");
      } else {
        console.log("logout: Deleting refresh tokens for user", userId);
        const deleted = await RefreshToken.destroy({
          where: { userId },
        });

        console.log("logout: Deleted", deleted, "refresh tokens");
        return deleted > 0; // Возвращаем true, если хотя бы один токен был удалён
      }
    } catch (error) {
      console.error("logout: Error", error);
      return false; // Возвращаем false при любой ошибке
    }
  },

  me: async (args, context) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new Error("Not authenticated");
    } else {
      return await User.findByPk(userId);
    }
  },

  messages: async (args, context) => {
    const userId = context.user?.id;
    if (!userId) throw new Error("Not authenticated");
    return await Message.findAll({ where: { userId } });
  },

  sendMessage: async ({ content, user }, context) => {
    const userId = context.user;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userInstance = await User.findByPk(userId.id);
    const message = await Message.create({
      content,
      user,
      userId: userId.id,
    });

    if (!userInstance.threadId) {
      const thread = await bot.api.createForumTopic(
        chatId,
        `Тема для ${userInstance.email} (ID: ${userInstance.id})`
      );

      const threadId = thread.message_thread_id;
      await userInstance.update({ threadId });

      await bot.api.sendMessage(
        chatId,
        `Тема создана для ${userInstance.email}!`,
        { message_thread_id: threadId }
      );
    }

    await bot.api.sendMessage(
      chatId,
      `Новое сообщение от ${userInstance.email}: ${message.content}`,
      { message_thread_id: userInstance.threadId }
    );

    const roomId = createRoomId(userId.id);
    const messageData = {
      id: message.id,
      content: message.content,
      user: message.user,
      //timestamp: message.createdAt.toISOString(),
    };

    // Отправляем сообщение в комнату пользователя
    context.io.to(roomId).emit("newMessage", messageData);

    // Отправляем в комнату админа
    context.io.to("admin-room").emit("adminMessage", {
      roomId,
      ...messageData,
    });

    // Логируем для админа
    console.log(
      `[Admin Log] User ${userId.id} -> Telegram (${userInstance.threadId}): ${content}`
    );

    return message;
  },
};

module.exports = root;
