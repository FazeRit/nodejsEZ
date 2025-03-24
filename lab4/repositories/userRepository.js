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

/**
 * Отримує всіх користувачів.
 * @returns {Promise<Array>} Список усіх користувачів.
 */
export const getAllUsers = async () => {
  try {
    const res = await pool.query("SELECT * FROM people");
    return res.rows;
  } catch (error) {
    console.error("Помилка при отриманні всіх користувачів:", error);
    throw error;
  }
};

/**
 * Отримує користувача за його ID.
 * @param {number} id - Ідентифікатор користувача.
 * @returns {Promise<Object|null>} Об’єкт користувача, якщо знайдено, інакше null.
 */
export const getUserById = async (id) => {
  try {
    const res = await pool.query("SELECT * FROM people WHERE id = $1", [id]);
    return res.rows[0] || null;
  } catch (error) {
    console.error("Помилка при отриманні користувача за ID:", error);
    throw error;
  }
};
