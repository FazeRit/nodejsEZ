import { User } from "../models/user.js";

/**
 * Отримує всіх користувачів.
 * @returns {Promise<Array>} Список усіх користувачів або порожній масив у разі помилки.
 */
export const getAllUsers = () => {
  return User.findAll();
};

/**
 * Отримує користувача за його ID.
 * @param {number} id - Ідентифікатор користувача.
 * @returns {Promise<Object|null>} Об’єкт користувача, якщо знайдено, або null у разі помилки чи відсутності.
 */
export const getUserById = (id) => {
  return User.findByPk(id);
};
