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

let queues = [
  { id: 1, name: "Queue 1", ownerId: 1, isClosed: false, queueList: [2, 3] },
  { id: 2, name: "Queue 2", ownerId: 2, isClosed: false, queueList: [] },
];
let nextId = 3;

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
export const getQueueById = (id) => queues.find((q) => q.id === id);

/**
 * Створює нову чергу.
 * @param {Object} queue - Дані черги для створення.
 * @returns {Object} Новий об’єкт черги з призначеним ID.
 */
export const createQueue = (queue) => {
  const newQueue = { id: nextId++, ...queue };
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

const fs = require('fs').promises;
const path = require('path');
const dataFilePath = path.join(__dirname, '../data/queues.json');

// Функція для асинхронного зчитування даних з файлу
async function findQueueById(queueId) {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    const queues = JSON.parse(data);
    return queues.find(queue => queue.id === queueId);
  } catch (error) {
    throw new Error(`Помилка читання даних: ${error.message}`);
  }
}

// Функція для асинхронного збереження оновлених даних в файл
async function saveQueue(updatedQueue) {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    let queues = JSON.parse(data);
    queues = queues.map(queue => queue.id === updatedQueue.id ? updatedQueue : queue);
    await fs.writeFile(dataFilePath, JSON.stringify(queues, null, 2));
    return updatedQueue;
  } catch (error) {
    throw new Error(`Помилка запису даних: ${error.message}`);
  }
}

module.exports = {
  findQueueById,
  saveQueue,
};
