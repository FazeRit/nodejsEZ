import sequelize from "../config/db.js";
import { Queue } from "./queue.js";
import { User } from "./user.js";

// Налаштування асоціацій (зв’язків між моделями)
Queue.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

// Синхронізація моделей із базою даних
(async () => {
  try {
    await sequelize.authenticate(); // Перевірка підключення

    await sequelize.sync({ alter: true }); // Оновлює схему без втрати даних

  } catch (error) {
    console.error("Помилка підключення або синхронізації з базою даних:", error);
  }
})();

// Експорт sequelize для використання в інших файлах
export { sequelize };

const User = require('./user')(sequelize, DataTypes);
const Queue = require('./queue')(sequelize, DataTypes);

User.associate?.({ Queue });
Queue.associate?.({ User });

module.exports = {
  User,
  Queue,
  sequelize,
};
