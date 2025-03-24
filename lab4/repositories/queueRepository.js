import pool from "../config/db.js";

/**
 * Отримує всі черги з бази даних.
 * @returns {Promise<Array>} Список усіх об’єктів черг або порожній масив у разі помилки.
 */
export const getAllQueues = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM queues");
    return res.rows;
  } catch (error) {
    console.log("Помилка при отриманні черг:", error.message);
    return [];
  } finally {
    client.release();
  }
};

/**
 * Отримує чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @returns {Promise<Object|null>} Об’єкт черги або null у разі помилки чи відсутності.
 */
export const getQueueById = async (id) => {
  if (!Number.isInteger(Number(id))) {
    console.log("Некоректний ID черги:", id);
    return null;
  }
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM queues WHERE id = $1", [id]);
    return res.rows[0] || null;
  } catch (error) {
    console.log("Помилка при отриманні черги:", error.message);
    return null;
  } finally {
    client.release();
  }
};

/**
 * Створює нову чергу.
 * @param {Object} queue - Дані черги для створення.
 * @returns {Promise<Object|null>} Новий об’єкт черги або null у разі помилки.
 */
export const createQueue = async (queue) => {
  const { name, owner_id, is_closed, queue_list } = queue;
  if (!name || !Number.isInteger(Number(owner_id))) {
    console.log("Некоректна назва або owner_id:", { name, owner_id });
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      "INSERT INTO queues (name, owner_id, is_closed, queue_list) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, owner_id, is_closed ?? false, queue_list || []]
    );
    await client.query("COMMIT");
    return res.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при створенні черги:", error.message);
    return null;
  } finally {
    client.release();
  }
};

/**
 * Оновлює існуючу чергу.
 * @param {number} id - Ідентифікатор черги для оновлення.
 * @param {Object} updatedQueue - Оновлені дані черги.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги або null у разі помилки чи відсутності.
 */
export const updateQueue = async (id, updatedQueue) => {
  if (!Number.isInteger(Number(id))) {
    console.log("Некоректний ID черги:", id);
    return null;
  }
  const { name, owner_id, is_closed, queue_list } = updatedQueue;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      "UPDATE queues SET name = $1, owner_id = $2, is_closed = $3, queue_list = $4 WHERE id = $5 RETURNING *",
      [name, owner_id, is_closed, queue_list || [], id]
    );
    if (res.rows.length === 0) {
      console.log("Чергу не знайдено для оновлення:", id);
      return null;
    }
    await client.query("COMMIT");
    return res.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при оновленні черги:", error.message);
    return null;
  } finally {
    client.release();
  }
};
