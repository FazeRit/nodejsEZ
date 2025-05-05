import { Queue } from "../models/queue.js";

/**
 * Отримує всі черги з бази даних.
 * @returns {Promise<Array>} Список усіх об’єктів черг або порожній масив у разі помилки.
 */
export const getAllQueues = () => {
  return Queue.findAll();
};

/**
 * Отримує чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @returns {Promise<Object|null>} Об’єкт черги або null у разі помилки чи відсутності.
 */
export const getQueueById = (id) => {
  return Queue.findByPk(id);
};

/**
 * Створює нову чергу.
 * @param {Object} queue - Дані черги для створення.
 * @returns {Promise<Object|null>} Новий об’єкт черги або null у разі помилки.
 */
export const createQueue = ({
  name,
  owner_id,
  is_closed = false,
  queue_list = [],
}) => {
  return Queue.create({ name, owner_id, is_closed, queue_list });
};

/**
 * Оновлює існуючу чергу.
 * @param {number} id - Ідентифікатор черги для оновлення.
 * @param {Object} updatedQueue - Оновлені дані черги.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги або null у разі помилки чи відсутності.
 */
export const updateQueue = async (id, updates) => {
  const queue = await Queue.findByPk(id);
  if (!queue) return null;
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      queue[key] = value;
    }
  });
  await queue.save();
  return queue;
};
