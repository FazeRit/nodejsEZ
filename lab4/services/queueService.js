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
 * Отримує конкретну чергу за її ID.
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
 * Створює нову чергу з указаними назвою та власником.
 * @param {string} name - Назва черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<Object|null>} Новий об’єкт черги або null у разі помилки.
 */
export const createQueue = async (name, owner_id) => {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isInteger(Number(owner_id))
  ) {
    console.log("Некоректна назва черги або owner_id:", { name, owner_id });
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      "INSERT INTO queues (name, owner_id, is_closed, queue_list) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, owner_id, false, []]
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
 * Дозволят користувачу приєднатися до черги, якщо вона відкрита і користувач ще не в черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, який приєднується.
 * @returns {Promise<boolean>} True, якщо користувач успішно приєднався, або false у разі помилки.
 */
export const joinQueue = async (queueId, userId) => {
  if (!Number.isInteger(Number(queueId)) || !Number.isInteger(Number(userId))) {
    console.log("Некоректний queueId або userId:", { queueId, userId });
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const queueCheck = await client.query(
      "SELECT is_closed, queue_list FROM queues WHERE id = $1 FOR UPDATE",
      [queueId]
    );
    if (queueCheck.rows.length === 0) {
      console.log("Чергу не знайдено:", queueId);
      return false;
    }
    const { is_closed, queue_list } = queueCheck.rows[0];
    if (is_closed) {
      console.log("Черга закрита:", queueId);
      return false;
    }
    if (queue_list.includes(userId)) {
      console.log("Користувач уже в черзі:", userId);
      return false;
    }

    const res = await client.query(
      "UPDATE queues SET queue_list = queue_list || $1 WHERE id = $2 RETURNING *",
      [[userId], queueId]
    );
    await client.query("COMMIT");
    return res.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при приєднанні до черги:", error.message);
    return false;
  } finally {
    client.release();
  }
};

/**
 * Отримує позицію користувача в конкретній черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача.
 * @returns {Promise<number|null>} Позиція користувача (нумерація з 1) або null у разі помилки.
 */
export const getUserPosition = async (queueId, userId) => {
  if (!Number.isInteger(Number(queueId)) || !Number.isInteger(Number(userId))) {
    console.log("Некоректний queueId або userId:", { queueId, userId });
    return null;
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT array_position(queue_list, $1) AS position FROM queues WHERE id = $2",
      [userId, queueId]
    );
    if (res.rows.length === 0) {
      console.log("Чергу не знайдено:", queueId);
      return null;
    }
    const position = res.rows[0].position;
    return position !== null ? position + 1 : null;
  } catch (error) {
    console.log("Помилка при отриманні позиції:", error.message);
    return null;
  } finally {
    client.release();
  }
};

/**
 * Просуває чергу, видаляючи першого користувача, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<{ nextUser: number, updatedQueue: Object }|null>} Об’єкт із наступним користувачем і оновленою чергою або null.
 */
export const nextInQueue = async (queueId, owner_id) => {
  if (
    !Number.isInteger(Number(queueId)) ||
    !Number.isInteger(Number(owner_id))
  ) {
    console.log("Некоректний queueId або owner_id:", { queueId, owner_id });
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const queueCheck = await client.query(
      "SELECT owner_id, queue_list FROM queues WHERE id = $1 FOR UPDATE",
      [queueId]
    );
    if (queueCheck.rows.length === 0) {
      console.log("Чергу не знайдено:", queueId);
      return null;
    }
    const { owner_id: queueOwnerId, queue_list } = queueCheck.rows[0];
    if (queueOwnerId !== owner_id) {
      console.log("Немає прав для просування черги:", { queueId, owner_id });
      return null;
    }
    if (queue_list.length === 0) {
      console.log("Черга порожня:", queueId);
      return null;
    }

    const res = await client.query(
      "UPDATE queues SET queue_list = queue_list[2:] WHERE id = $1 RETURNING queue_list[1] AS next_user, *",
      [queueId]
    );
    await client.query("COMMIT");
    const { next_user, ...updatedQueue } = res.rows[0];
    return { nextUser: next_user, updatedQueue };
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при просуванні черги:", error.message);
    return null;
  } finally {
    client.release();
  }
};

/**
 * Видаляє конкретного користувача з черги, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, якого потрібно видалити.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо користувача видалено, або false у разі помилки.
 */
export const removeUserFromQueue = async (queueId, userId, owner_id) => {
  if (
    !Number.isInteger(Number(queueId)) ||
    !Number.isInteger(Number(userId)) ||
    !Number.isInteger(Number(owner_id))
  ) {
    console.log("Некоректний queueId, userId або owner_id:", {
      queueId,
      userId,
      owner_id,
    });
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const queueCheck = await client.query(
      "SELECT owner_id, queue_list FROM queues WHERE id = $1 FOR UPDATE",
      [queueId]
    );
    if (queueCheck.rows.length === 0) {
      console.log("Чергу не знайдено:", queueId);
      return false;
    }
    const { owner_id: queueOwnerId, queue_list } = queueCheck.rows[0];
    if (queueOwnerId !== owner_id) {
      console.log("Немає прав для видалення користувача:", {
        queueId,
        owner_id,
      });
      return false;
    }
    if (!queue_list.includes(userId)) {
      console.log("Користувача не знайдено в черзі:", userId);
      return false;
    }

    const res = await client.query(
      "UPDATE queues SET queue_list = array_remove(queue_list, $1) WHERE id = $2 RETURNING *",
      [userId, queueId]
    );
    await client.query("COMMIT");
    return res.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при видаленні користувача з черги:", error.message);
    return false;
  } finally {
    client.release();
  }
};

/**
 * Закриває чергу, забороняючи подальші приєднання, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо чергу закрито, або false у разі помилки.
 */
export const closeQueue = async (queueId, owner_id) => {
  if (
    !Number.isInteger(Number(queueId)) ||
    !Number.isInteger(Number(owner_id))
  ) {
    console.log("Некоректний queueId або owner_id:", { queueId, owner_id });
    return false;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const queueCheck = await client.query(
      "SELECT owner_id, is_closed FROM queues WHERE id = $1 FOR UPDATE",
      [queueId]
    );
    if (queueCheck.rows.length === 0) {
      console.log("Чергу не знайдено:", queueId);
      return false;
    }
    const { owner_id: queueOwnerId, is_closed } = queueCheck.rows[0];
    if (queueOwnerId !== owner_id) {
      console.log("Немає прав для закриття черги:", { queueId, owner_id });
      return false;
    }
    if (is_closed) {
      console.log("Черга вже закрита:", queueId);
      return false;
    }

    const res = await client.query(
      "UPDATE queues SET is_closed = true WHERE id = $1 RETURNING *",
      [queueId]
    );
    await client.query("COMMIT");
    return res.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при закритті черги:", error.message);
    return false;
  } finally {
    client.release();
  }
};

/**
 * Передає права власника черги іншому користувачу.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} currentOwnerId - Ідентифікатор поточного власника.
 * @param {number} newOwnerId - Ідентифікатор нового власника.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги або null у разі помилки.
 */
export const transferQueueOwnership = async (queueId, currentOwnerId, newOwnerId) => {
  if (
    !Number.isInteger(Number(queueId)) ||
    !Number.isInteger(Number(currentOwnerId)) ||
    !Number.isInteger(Number(newOwnerId))
  ) {
    console.log("Некоректний queueId, currentOwnerId або newOwnerId:", { queueId, currentOwnerId, newOwnerId });
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Перевірка, чи існує черга та чи поточний власник має права
    const queueCheck = await client.query(
      "SELECT owner_id FROM queues WHERE id = $1 FOR UPDATE",
      [queueId]
    );
    if (queueCheck.rows.length === 0) {
      throw new Error("Чергу не знайдено");
    }
    if (queueCheck.rows[0].owner_id !== currentOwnerId) {
      throw new Error("Немає прав для передачі власності");
    }

    // Перевірка, чи новий власник існує (проста перевірка через таблицю people)
    const userCheck = await client.query("SELECT id FROM people WHERE id = $1", [newOwnerId]);
    if (userCheck.rows.length === 0) {
      throw new Error("Нового власника не знайдено");
    }

    // Оновлення власника черги
    const res = await client.query(
      "UPDATE queues SET owner_id = $1 WHERE id = $2 RETURNING *",
      [newOwnerId, queueId]
    );

    if (res.rows.length === 0) {
      throw new Error("Не вдалося оновити власника черги");
    }

    // Підтвердження транзакції
    await client.query("COMMIT");
    console.log("Власність черги успішно передана:", res.rows[0]);
    return res.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Помилка при передачі власності черги:", error.message);
    return null;
  } finally {
    client.release();
  }
};