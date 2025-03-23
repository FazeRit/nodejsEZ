/**
 * @fileoverview Шар репозиторію для даних користувачів у системі "Електронна черга".
 *
 * @description
 * Цей модуль надає методи доступу до даних користувачів. Використовується асинхронне читання з файлу users.json
 * з використанням функцій зворотного виклику (callbacks). Дані зберігаються в масиві users.
 *
 * Властивості користувача:
 * - id: Унікальний ідентифікатор.
 * - name: Ім’я користувача.
 *
 * @module repositories/userRepository
 *
 * @author [Potapenko Eldar]
 * @date 16-03-2025
 */
import pool from "../config/db.js";

let users = [];

export const getAllUsers = async () => {
  try {
    const res = await pool.query("SELECT * FROM people");
    res.rows.forEach((newUser) => {
      if (!users.some((u) => u.id === newUser.id)) {
        users.push(newUser);
      }
    });
    return users;
  } catch (error) {
    console.error("Помилка при отриманні всіх користувачів:", error);
    throw error;
  }
};

(async () => {
  await getAllUsers();
  console.log("Queue data initialized from BD:", users);
})();

/**
 * Отримує користувача за його ID.
 * @param {number} id - Ідентифікатор користувача.
 * @returns {Object|null} Об’єкт користувача, якщо знайдено, інакше null.
 */
const getUserById = (id) => users.find((u) => u.id === id);

// Експортуємо функції для використання в інших модулях
export { getUserById };
