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

import fs from 'fs'; // Імпорт модуля fs як ES Module

const FILE_PATH = "users.json"; // Шлях до файлу

let users = [
  { id: 1, name: "Owner1" },
  { id: 2, name: "User1" },
  { id: 3, name: "User2" },
];

/**
 * Читає список користувачів з файлу і додає нових до масиву users.
 * @param {function} callback - Функція з параметрами (error, data).
 */
const readUsersFromFile = (callback) => {
  // console.log("Масив users ДО зчитування:", users); // Вивід до зчитування
  
  fs.readFile(FILE_PATH, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // Якщо файл не існує, повертаємо поточний масив users
        return callback(null, users);
      }
      return callback(err, null);
    }
    try {
      // Парсимо JSON із файлу
      const fileUsers = JSON.parse(data || "[]");
      
      // Додаємо лише тих користувачів, яких ще немає в масиві (за id)
      fileUsers.forEach((fileUser) => {
        if (!users.some((u) => u.id === fileUser.id)) {
          users.push(fileUser);
        }
      });
      
      // console.log("Масив users ПІСЛЯ зчитування:", users); // Вивід після зчитування
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
export {
  readUsersFromFile,
  getUserById
};

// Приклад використання
// readUsersFromFile((err, data) => {
//   if (err) {
//     console.error("Помилка при читанні файлу:", err);
//     return;
//   }
//   console.log("Оновлений масив користувачів (з callback):", data);
  
//   // Приклад виклику getUserById після зчитування
//   const user = getUserById(2);
//   console.log("Користувач з ID 2:", user);
// });