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

const fs = require('fs'); // Імпорт модуля fs

const FILE_PATH = "users.json"; // Шлях до файлу
let users = []; // Ініціалізація масиву users

/**
 * Читає список користувачів з файлу і оновлює масив users.
 * @param {function} callback - Функція з параметрами (error, data).
 */
const readUsersFromFile = (callback) => {
  fs.readFile(FILE_PATH, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // Якщо файл не існує, повертаємо пустий масив
        users = [];
        return callback(null, users);
      }
      return callback(err, null);
    }
    try {
      // Парсимо JSON і оновлюємо масив users
      users = JSON.parse(data || "[]");
      callback(null, users);
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
};

/**
 * Отримує користувача за його ID.
 * @param {number} id - Ідентифікатор користувача.
 * @returns {Object|null} Об’єкт користувача, якщо знайдено, інакше null.
 */
const getUserById = (id) => users.find((u) => u.id === id);

// Експортуємо функції для використання в інших модулях
module.exports = {
  readUsersFromFile,
  getUserById
};

// // Приклад використання
// readUsersFromFile((err, data) => {
//   if (err) {
//     console.error("Помилка при читанні файлу:", err);
//     return;
//   }
//   console.log("Дані користувачів:", data);
  
//   // Приклад виклику getUserById після зчитування
//   const user = getUserById(2);
//   console.log("Користувач з ID 2:", user);
// });