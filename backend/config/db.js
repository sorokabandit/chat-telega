const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("mydb", "daniilsorokin", "password", {
  host: "localhost",
  dialect: "postgres",
  logging: console.log, // Включаем логирование SQL-запросов для отладки
});

const UserModel = require("../src/models/user.js");
const RefreshTokenModel = require("../src/models/token.js");
const MessageModel = require("../src/models/message.js");


const User = UserModel(sequelize);
const RefreshToken = RefreshTokenModel(sequelize);
const Message = MessageModel(sequelize);

// Устанавливаем связи
User.hasMany(RefreshToken, { foreignKey: "userId" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

// Проверка подключения к базе данных
sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection error:", err));

// Синхронизация моделей с базой данных
sequelize
  .sync({ force: true }) // force: false, чтобы не удалять существующие таблицы
  .then(() => console.log("Database synced"))
  .catch((err) => console.error("Database sync error:", err));


module.exports = { sequelize, User, RefreshToken, Message};