const { DataTypes } = require("sequelize");
const user = require("./user");

// Модель принимает sequelize как аргумент
module.exports = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // Указываем имя таблицы вместо модели User
          key: "id",
        },
      },
    },
    {
      tableName: "messages",
      timestamps: false,
    }
  );

  return Message;
};
