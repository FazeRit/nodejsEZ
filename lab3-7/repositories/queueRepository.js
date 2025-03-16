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
 * - ownerId: Ідентифікатор власника черги.
 * - isClosed: Булеве значення, що вказує, чи закрита черга.
 * - queueList: Масив ідентифікаторів користувачів у черзі.
 *
 * Містить тестові дані для демонстрації. Розроблено для заміни реальною базою даних у майбутньому.
 *
 * @module repositories/queueRepository
 *
 * @author [Ваше Ім’я]
 * @date 2025-02-27
 */

import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let queues = [
  { id: 1, name: "Queue 1", ownerId: 1, isClosed: false, queueList: [2, 3] },
  { id: 2, name: "Queue 2", ownerId: 2, isClosed: false, queueList: [] },
];

const readFileWithAwait = async (filename) => {
  try {
    const filePath = path.join(__dirname, filename);
    const data = await fs.promises.readFile(filePath, "utf8");
    if (!data || data.trim() === "") {
      console.warn(
        `File ${filename} is empty or invalid, using default queues.`
      );
      return queues;
    }

    const parsedData = JSON.parse(data);
    queues.push(...parsedData);
    console.log(`Added ${parsedData.length} new queues from ${filename}`);
    return queues;
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error.message);
    return queues;
  }
};

(async () => {
  await readFileWithAwait("queues.json");
  console.log("Queue data initialized:", queues);
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
