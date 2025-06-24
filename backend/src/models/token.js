const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    "RefreshToken",
    {
      token: {
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
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "refreshtokens", // Явно указываем имя таблицы в нижнем регистре
      timestamps: false, // Отключаем timestamps для согласованности
    }
  );

  return RefreshToken;
};
