import * as queueRepo from "../repositories/queueRepository.js";

/**
 * Отримує всі черги з бази даних.
 * @returns {Promise<Array>} Список усіх об’єктів черг або порожній масив у разі помилки.
 */
export const getAllQueues = () => {
  return queueRepo.getAllQueues();
};

/**
 * Отримує конкретну чергу за її ID.
 * @param {number} id - Ідентифікатор черги.
 * @returns {Promise<Object|null>} Об’єкт черги або null у разі помилки чи відсутності.
 */
export const getQueueById = (id) => {
  return queueRepo.getQueueById(id);
};

/**
 * Створює нову чергу з указаними назвою та власником.
 * @param {string} name - Назва черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<Object|null>} Новий об’єкт черги або null у разі помилки.
 */
export const createQueue = (data) => {
  return queueRepo.createQueue(data);
};

/**
 * Дозволят користувачу приєднатися до черги, якщо вона відкрита і користувач ще не в черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, який приєднується.
 * @returns {Promise<boolean>} True, якщо користувач успішно приєднався, або false у разі помилки.
 */
export const joinQueue = async (queueId, userId) => {
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue || queue.is_closed || queue.queue_list.includes(userId))
    return false;

  queue.queue_list.push(userId);
  const updated = await queueRepo.updateQueue(queueId, {
    queue_list: queue.queue_list,
  });
  return !!updated;
};

/**
 * Отримує позицію користувача в конкретній черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача.
 * @returns {Promise<number|null>} Позиція користувача (нумерація з 1) або null у разі помилки.
 */
export const getUserPosition = async (queueId, userId) => {
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue) return null;

  const position = queue.queue_list.indexOf(userId);
  return position >= 0 ? position + 1 : null;
};

/**
 * Просуває чергу, видаляючи першого користувача, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<{ nextUser: number, updatedQueue: Object }|null>} Об’єкт із наступним користувачем і оновленою чергою або null.
 */
export const nextInQueue = async (queueId, owner_id) => {
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue || queue.owner_id !== owner_id || queue.queue_list.length === 0)
    return null;

  const [nextUser, ...rest] = queue.queue_list;
  const updatedQueue = await queueRepo.updateQueue(queueId, {
    queue_list: rest,
  });
  const data = { nextUser, updatedQueue };
  return updatedQueue ? data : null;
};

/**
 * Видаляє конкретного користувача з черги, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, якого потрібно видалити.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо користувача видалено, або false у разі помилки.
 */
export const removeUserFromQueue = async (queueId, userId, owner_id) => {
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue || queue.owner_id !== owner_id) return false;

  const filteredList = queue.queue_list.filter((id) => id !== userId);
  if (filteredList.length === queue.queue_list.length) return false;

  const updated = await queueRepo.updateQueue(queueId, {
    queue_list: filteredList,
  });
  return Boolean(updated);
};

/**
 * Закриває чергу, забороняючи подальші приєднання, якщо запит від власника.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо чергу закрито, або false у разі помилки.
 */
export const closeQueue = async (queueId, owner_id) => {
  const queue = await queueRepo.getQueueById(queueId);

  const queueNotFound = !queue;
  const notOwner = queue?.owner_id !== owner_id;
  const alreadyClosed = queue?.is_closed;

  const shouldAbort = queueNotFound || notOwner || alreadyClosed;
  if (shouldAbort) return false;

  const updated = await queueRepo.updateQueue(queueId, { is_closed: true });

  return Boolean(updated);
};

/**
 * Передає права власника черги іншому користувачу.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} currentOwnerId - Ідентифікатор поточного власника.
 * @param {number} newOwnerId - Ідентифікатор нового власника.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги або null у разі помилки.
 */
export const transferQueueOwnership = async (
  queueId,
  currentOwnerId,
  newOwnerId
) => {
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue || queue.owner_id !== currentOwnerId) return null;

  const updated = await queueRepo.updateQueue(queueId, {
    owner_id: newOwnerId,
  });
  return updated;
};
