import { Op } from "sequelize";
import { Queue } from "../models/queue.js";

/**
 * Отримує всі черги з бази даних.
 * @returns {Promise<Array>} Список усіх об’єктів черг або порожній масив у разі помилки.
 */
export const getAllQueues = () => {
  return Queue.findAll();
};

export const getFilteredQueues = async (page = 1, limit = 10, q = "") => {
	const offset = (page - 1) * limit;
	const where = q
		? { name: { [Op.like]: `%${q}%` } }
		: undefined;

	const { rows: queues, count: total } = await Queue.findAndCountAll({
		where,
		limit,
		offset,
	});

	return { queues, totalPages: Math.ceil(total / limit), };
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
 * @param {Object} [options] - Опції, наприклад, транзакція.
 * @returns {Promise<Object|null>} Новий об’єкт черги або null у разі помилки.
 */
export const createQueue = ({
  name,
  owner_id,
  is_closed = false,
  queue_list = [],
}, options = {}) => {
  return Queue.create({ name, owner_id, is_closed, queue_list }, options);
};

/**
 * Оновлює існуючу чергу.
 * @param {number} id - Ідентифікатор черги для оновлення.
 * @param {Object} updates - Оновлені дані черги.
 * @param {Object} [options] - Опції, наприклад, транзакція.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги або null у разі помилки чи відсутності.
 */
export const updateQueue = async (id, updates, options = {}) => {
  const queue = await Queue.findByPk(id, options);
  if (!queue) return null;
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      queue[key] = value;
    }
  });
  await queue.save(options);
  return queue;
};

/**
 * Видаляє чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @param {Object} [options] - Опції, наприклад, транзакція.
 * @returns {Promise<boolean>} True, якщо чергу видалено, або false у разі помилки.
 */
export const deleteQueue = async (id, options = {}) => {
  const queue = await Queue.findByPk(id, options);
  if (!queue) return false;
  await queue.destroy(options);
  return true;
};