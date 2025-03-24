/**
 * @fileoverview Шар репозиторію для даних черг у системі "Електронна черга".
 *
 * @description
 * Цей модуль надає методи доступу до даних черг у базі даних PostgreSQL через бібліотеку pg.
 * Замінює in-memory сховище реальними SQL-запитами для CRUD-операцій.
 *
 * Властивості черги:
 * - id: Унікальний ідентифікатор (генерується базою).
 * - name: Назва черги.
 * - owner_id: Ідентифікатор власника черги.
 * - is_closed: Булеве значення, що вказує, чи закрита черга.
 * - queue_list: Масив ідентифікаторів користувачів у черзі (зберігається як integer[]).
 *
 * @module repositories/queueRepository
 *
 * @author [Ваше Ім’я]
 * @date 2025-02-27
 */

import pool from "../config/db.js";

/**
 * Отримує всі черги з бази даних.
 * @returns {Promise<Array>} Список усіх об’єктів черг.
 */
export const getAllQueues = async () => {
  try {
    const res = await pool.query("SELECT * FROM queues");
    return res.rows;
  } catch (error) {
    console.error("Помилка при отриманні черг:", error);
    throw error;
  }
};

/**
 * Отримує чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @returns {Promise<Object|null>} Об’єкт черги, якщо знайдено, інакше null.
 */
export const getQueueById = async (id) => {
  try {
    const res = await pool.query("SELECT * FROM queues WHERE id = $1", [id]);
    return res.rows[0] || null;
  } catch (error) {
    console.error("Помилка при отриманні черги за ID:", error);
    throw error;
  }
};

/**
 * Створює нову чергу.
 * @param {Object} queue - Дані черги для створення.
 * @returns {Promise<Object>} Новий об’єкт черги з призначеним ID.
 */
export const createQueue = async (queue) => {
  const { name, owner_id, is_closed, queue_list } = queue;
  try {
    const res = await pool.query(
      "INSERT INTO queues (name, owner_id, is_closed, queue_list) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, owner_id, is_closed, queue_list || []]
    );
    return res.rows[0];
  } catch (error) {
    console.error("Помилка при створенні черги:", error);
    throw error;
  }
};

/**
 * Оновлює існуючу чергу.
 * @param {number} id - Ідентифікатор черги для оновлення.
 * @param {Object} updatedQueue - Оновлені дані черги.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги, якщо знайдено, інакше null.
 */
export const updateQueue = async (id, updatedQueue) => {
  const { name, owner_id, is_closed, queue_list } = updatedQueue;
  try {
    const res = await pool.query(
      "UPDATE queues SET name = $1, owner_id = $2, is_closed = $3, queue_list = $4 WHERE id = $5 RETURNING *",
      [name, owner_id, is_closed, queue_list || [], id]
    );
    return res.rows[0] || null;
  } catch (error) {
    console.error("Помилка при оновленні черги:", error);
    throw error;
  }
};
