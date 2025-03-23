/**
 * @fileoverview Сервісний шар для системи "Електронна черга".
 *
 * @description
 * Цей модуль містить бізнес-логіку для управління чергами. Він є посередником між контролерами та репозиторіями,
 * інкапсулюючи операції, такі як створення черг, приєднання до черг, просування черг, видалення користувачів та закриття черг.
 *
 * Усі методи розроблені так, щоб їх можна було легко адаптувати для роботи з реальною базою даних у майбутньому.
 * Наразі використовуються in-memory заглушки з шару репозиторіїв для операцій із даними.
 *
 * @module services/queueService
 *
 * @requires ../repositories/queueRepository.js - Репозиторій для доступу до даних черг.
 * @requires ../repositories/userRepository.js - Репозиторій для доступу до даних користувачів.
 *
 * @author [Ваше Ім’я]
 * @date 2025-02-27
 */

import * as queueRepository from "../repositories/queueRepository.js";
import * as userRepository from "../repositories/userRepository.js";

/**
 * Отримує всі черги з репозиторію.
 * @returns {Array} Список усіх об’єктів черг.
 */
export const getAllQueues = () => queueRepository.getAllQueues();

/**
 * Отримує конкретну чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @returns {Object|null} Об’єкт черги, якщо знайдено, інакше null.
 */
export const getQueueById = (id) => queueRepository.getQueueById(id);

/**
 * Створює нову чергу з указаними назвою та власником.
 * @param {string} name - Назва черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Object} Новий об’єкт черги.
 */
export const createQueue = (name, owner_id) => {
  const queue = { name, owner_id, is_closed: false, queue_list: [] };
  return queueRepository.createQueue(queue);
};

/**
 * Дозволяє користувачу приєднатися до черги, якщо вона відкрита і користувач ще не в черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, який приєднується.
 * @returns {boolean} True, якщо користувач успішно приєднався, інакше false.
 */
export const joinQueue = (queueId, userId) => {
  const queue = queueRepository.getQueueById(queueId);
  if (queue && !queue.is_closed && !queue.queue_list.includes(userId)) {
    queue.queue_list.push(userId);
    queueRepository.updateQueue(queueId, queue);
    return true;
  }
  return false;
};

/**
 * Отримує позицію користувача в конкретній черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача.
 * @returns {number|null} Позиція користувача (нумерація з 1), якщо знайдено, інакше null.
 */
export const getUserPosition = (queueId, userId) => {
  const queue = queueRepository.getQueueById(queueId);
  if (queue) {
    const position = queue.queue_list.indexOf(userId);
    if (position !== -1) return position + 1;
  }
  return null;
};

/**
 * Просуває чергу, видаляючи першого користувача, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {number|null} Ідентифікатор наступного користувача, якщо успішно, інакше null.
 */
export const nextInQueue = (queueId, owner_id) => {
  const queue = queueRepository.getQueueById(queueId);
  if (isOwner(queueId, owner_id) && queue.queue_list.length > 0) {
    const nextUser = queue.queue_list.shift();
    queueRepository.updateQueue(queueId, queue);
    return nextUser;
  }
  return null;
};

/**
 * Видаляє конкретного користувача з черги, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, якого потрібно видалити.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {boolean} True, якщо користувача успішно видалено, інакше false.
 */
export const removeUserFromQueue = (queueId, userId, owner_id) => {
  const queue = queueRepository.getQueueById(queueId);
  if (isOwner(queueId, owner_id)) {
    const index = queue.queue_list.indexOf(userId);
    if (index !== -1) {
      queue.queue_list.splice(index, 1);
      queueRepository.updateQueue(queueId, queue);
      return true;
    }
  }
  return false;
};

const isOwner = (queueId, userId) => {
  const queue = queueRepository.getQueueById(queueId);
  return queue && queue.owner_id === userId;
};

/**
 * Закриває чергу, забороняючи подальші приєднання, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {boolean} True, якщо чергу успішно закрито, інакше false.
 */
export const closeQueue = (queueId, owner_id) => {
  const queue = queueRepository.getQueueById(queueId);
  if (isOwner(queueId, owner_id) && !queue.is_closed) {
    queue.is_closed = true;
    queueRepository.updateQueue(queueId, queue);
    return true;
  }
  return false;
};
