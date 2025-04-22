import * as queueRepository from "../repositories/queueRepository.js";

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
 * @param {number} ownerId - Ідентифікатор власника черги.
 * @returns {Object} Новий об’єкт черги.
 */
export const createQueue = (name, ownerId) => {
  const queue = { name, ownerId, isClosed: false, queueList: [] };
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
  if (queue && !queue.isClosed && !queue.queueList.includes(userId)) {
    queue.queueList.push(userId);
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
    const position = queue.queueList.indexOf(userId);
    if (position !== -1) return position + 1;
  }
  return null;
};

/**
 * Просуває чергу, видаляючи першого користувача, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} ownerId - Ідентифікатор власника черги.
 * @returns {number|null} Ідентифікатор наступного користувача, якщо успішно, інакше null.
 */
export const nextInQueue = (queueId, ownerId) => {
  const queue = queueRepository.getQueueById(queueId);
  if (
    isOwner(queueId, ownerId) &&
    queue.queueList.length > 0 &&
    !queue.isClosed
  ) {
    const nextUser = queue.queueList.shift();
    queueRepository.updateQueue(queueId, queue);
    return nextUser;
  }
  return null;
};

/**
 * Видаляє конкретного користувача з черги, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, якого потрібно видалити.
 * @param {number} ownerId - Ідентифікатор власника черги.
 * @returns {boolean} True, якщо користувача успішно видалено, інакше false.
 */
export const removeUserFromQueue = (queueId, userId, ownerId) => {
  const queue = queueRepository.getQueueById(queueId);
  if (isOwner(queueId, ownerId)) {
    const index = queue.queueList.indexOf(userId);
    if (index !== -1) {
      queue.queueList.splice(index, 1);
      queueRepository.updateQueue(queueId, queue);
      return true;
    }
  }
  return false;
};

const isOwner = (queueId, userId) => {
  const queue = queueRepository.getQueueById(queueId);
  return queue && queue.ownerId === userId;
};

/**
 * Закриває чергу, забороняючи подальші приєднання, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} ownerId - Ідентифікатор власника черги.
 * @returns {boolean} True, якщо чергу успішно закрито, інакше false.
 */
export const closeQueue = (queueId, ownerId) => {
  const queue = queueRepository.getQueueById(queueId);
  if (isOwner(queueId, ownerId) && !queue.isClosed) {
    queue.isClosed = true;
    queueRepository.updateQueue(queueId, queue);
    return true;
  }
  return false;
};
