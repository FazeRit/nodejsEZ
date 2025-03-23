/**
 * @fileoverview Шар репозиторію для даних черг у системі "Електронна черга".
 *
 * @description
 * Цей модуль надає методи доступу до даних черг. Наразі використовується in-memory сховище як заглушка,
 * що імітує базу даних із масивом об’єктів черг та базовими CRUD-операціями.
 *
 * Властивості черги:
 * - id: Унікальний ідентифікатор.
 * - name: Назва черги.
 * - owner_id: Ідентифікатор власника черги.
 * - is_closed: Булеве значення, що вказує, чи закрита черга.
 * - queue_list: Масив ідентифікаторів користувачів у черзі.
 *
 * Містить тестові дані для демонстрації. Розроблено для заміни реальною базою даних у майбутньому.
 *
 * @module repositories/queueRepository
 *
 * @author [Ваше Ім’я]
 * @date 2025-02-27
 */

import pool from "../config/db.js";

let queues = [];

export const getAllQueuesBD = async () => {
  try {
    const res = await pool.query("SELECT * FROM queues");
    res.rows.forEach((newQueue) => {
      if (!queues.some((q) => q.id === newQueue.id)) {
        queues.push(newQueue);
      }
    });
    return queues;
  } catch (error) {
    console.error("Помилка при отриманні черг:", error);
    throw error;
  }
};

(async () => {
  await getAllQueuesBD();
  console.log("Queue data initialized from BD:", queues);
})();

const getNextId = () => {
  if (queues.length === 0) return 1;
  const maxId = Math.max(...queues.map((q) => q.id));
  return maxId + 1;
};

/**
 * Отримує всі черги.
 * @returns {Array} Список усіх об’єктів черг.
 */
export const getAllQueues = () => queues;

/**
 * Отримує чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @returns {Object|null} Об’єкт черги, якщо знайдено, інакше null.
 */
export const getQueueById = (id) => queues.find((q) => q.id === id) || null;

/**
 * Створює нову чергу.
 * @param {Object} queue - Дані черги для створення.
 * @returns {Object} Новий об’єкт черги з призначеним ID.
 */
export const createQueue = (queue) => {
  const newQueue = { id: getNextId(), ...queue };
  queues.push(newQueue);
  return newQueue;
};

/**
 * Оновлює існуючу чергу.
 * @param {number} id - Ідентифікатор черги для оновлення.
 * @param {Object} updatedQueue - Оновлені дані черги.
 * @returns {Object|null} Оновлений об’єкт черги, якщо знайдено, інакше null.
 */
export const updateQueue = (id, updatedQueue) => {
  const index = queues.findIndex((q) => q.id === id);
  if (index !== -1) {
    queues[index] = { ...queues[index], ...updatedQueue };
    return queues[index];
  }
  return null;
};
