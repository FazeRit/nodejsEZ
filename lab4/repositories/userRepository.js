import pool from "../config/db.js";

/**
 * Отримує всіх користувачів.
 * @returns {Promise<Array>} Список усіх користувачів або порожній масив у разі помилки.
 */
export const getAllUsers = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM people");
    return res.rows;
  } catch (error) {
    console.log("Помилка при отриманні всіх користувачів:", error.message);
    return [];
  } finally {
    client.release();
  }
};

/**
 * Отримує користувача за його ID.
 * @param {number} id - Ідентифікатор користувача.
 * @returns {Promise<Object|null>} Об’єкт користувача, якщо знайдено, або null у разі помилки чи відсутності.
 */
export const getUserById = async (id) => {
  if (!Number.isInteger(Number(id))) {
    console.log("Некоректний ID користувача:", id);
    return null;
  }

  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM people WHERE id = $1", [id]);
    return res.rows[0] || null;
  } catch (error) {
    console.log("Помилка при отриманні користувача за ID:", error.message);
    return null;
  } finally {
    client.release();
  }
};
