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
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = "users.json";
const FILE_PATH1 = "users1.json";

let users = [];

const readFileWithPromise = (filename) => {
  const filePath = path.join(__dirname, filename);
  return fs.promises
    .readFile(filePath, "utf8")
    .then((data) => {
      if (!data || data.trim() === "") {
        console.warn(
          `File ${filename} is empty or invalid, using default users.`
        );
        return users;
      }
      const parsedData = JSON.parse(data);
      console.log(parsedData);

      users.push(...parsedData);
      console.log(`Added ${parsedData.length} new users from ${filename}`);
      return users;
    })
    .catch((error) => {
      console.error(`Error reading file ${filename}:`, error.message);
      return users;
    });
};

readFileWithPromise(FILE_PATH1).then((usersData) => {
  console.log("Queue data initialized 1:", usersData);
});

/**
 * Читає список користувачів з файлу і додає нових до масиву users.
 * @param {function} callback - Функція з параметрами (error, data).
 */
const readUsersFromFile = (callback) => {
  fs.readFile(path.join(__dirname, FILE_PATH), "utf8", (err, data) => {
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

      // Додаємо користувачів з файлу до масиву
      users.push(...fileUsers);

      console.log("Масив users ПІСЛЯ зчитування:", users);
      callback(null, users);
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
};

// Виклик функції readUsersFromFile для завантаження користувачів та виведення результату
readUsersFromFile((err, data) => {
  if (err) {
    console.error("Error reading users from file:", err);
  } else {
    console.log("Users loaded via callback:", data);
  }
});

/**
 * Отримує користувача за його ID.
 * @param {number} id - Ідентифікатор користувача.
 * @returns {Object|null} Об’єкт користувача, якщо знайдено, інакше null.
 */
const getUserById = (id) => users.find((u) => u.id === id);

// Експортуємо функції для використання в інших модулях
export { readUsersFromFile, getUserById };
