import * as queueRepo from "../repositories/queueRepository.js";
import * as userRepo from "../repositories/userRepository.js";
import { sequelize } from "../models/sequelize-config.js";

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
 * Створює нову чергу з указаними назвою та власником транзакційно.
 * @param {Object} data - Дані черги (name, owner_id).
 * @returns {Promise<Object|null>} Новий об’єкт черги або null у разі помилки.
 */
export const createQueue = async (data) => {
  const { name, owner_id } = data;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return null; // Некоректна назва
  }
  if (!Number.isInteger(owner_id)) {
    return null; // Некоректний ID власника
  }
  const owner = await userRepo.getUserById(owner_id);
  if (!owner) {
    return null; // Власника не знайдено
  }
  return await sequelize.transaction(async (t) => {
    return await queueRepo.createQueue({ name, owner_id }, { transaction: t });
  });
};

/**
 * Дозволяє користувачу приєднатися до черги, якщо вона відкрита і користувач ще не в черзі, транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, який приєднується.
 * @returns {Promise<boolean>} True, якщо користувач успішно приєднався, або false у разі помилки.
 */
export const joinQueue = async (queueId, userId) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(userId)) {
    return false; // Некоректні ID
  }
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue) {
    return false; // Чергу не знайдено
  }
  const user = await userRepo.getUserById(userId);
  if (!user) {
    return false; // Користувача не знайдено
  }
  if (queue.is_closed) {
    return false; // Черга закрита
  }
  if (queue.queue_list.includes(userId)) {
    return false; // Користувач уже в черзі
  }
  return await sequelize.transaction(async (t) => {
    queue.queue_list.push(userId);
    const updated = await queueRepo.updateQueue(queueId, {
      queue_list: queue.queue_list,
    }, { transaction: t });
    return !!updated;
  });
};

/**
 * Отримує позицію користувача в конкретній черзі.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача.
 * @returns {Promise<number|null>} Позиція користувача (нумерація з 1) або null у разі помилки.
 */
export const getUserPosition = async (queueId, userId) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(userId)) {
    return null; // Некоректні ID
  }
  const queue = await queueRepo.getQueueById(queueId);
  if (!queue) {
    return null; // Чергу не знайдено
  }
  const position = queue.queue_list.indexOf(userId);
  return position >= 0 ? position + 1 : null;
};

/**
 * Просуває чергу, видаляючи першого користувача, якщо запит від власника, транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<{ nextUser: number, updatedQueue: Object }|null>} Об’єкт із наступним користувачем і оновленою чергою або null.
 */
export const nextInQueue = async (queueId, owner_id) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(owner_id)) {
    return null; // Некоректні ID
  }
  return await sequelize.transaction(async (t) => {
    const queue = await queueRepo.getQueueById(queueId, { transaction: t });
    if (!queue || queue.owner_id !== owner_id || queue.queue_list.length === 0) {
      return null; // Чергу не знайдено, не власник або порожня черга
    }
    const [nextUser, ...rest] = queue.queue_list;
    const updatedQueue = await queueRepo.updateQueue(queueId, {
      queue_list: rest,
    }, { transaction: t });
    return updatedQueue ? { nextUser, updatedQueue } : null;
  });
};

/**
 * Видаляє конкретного користувача з черги, якщо запит від власника, транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача, якого потрібно видалити.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо користувача видалено, або false у разі помилки.
 */
export const removeUserFromQueue = async (queueId, userId, owner_id) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(userId) || !Number.isInteger(owner_id)) {
    return false; // Некоректні ID
  }
  return await sequelize.transaction(async (t) => {
    const queue = await queueRepo.getQueueById(queueId, { transaction: t });
    if (!queue || queue.owner_id !== owner_id) {
      return false; // Чергу не знайдено або не власник
    }
    const filteredList = queue.queue_list.filter((id) => id !== userId);
    if (filteredList.length === queue.queue_list.length) {
      return false; // Користувача немає в черзі
    }
    const updated = await queueRepo.updateQueue(queueId, {
      queue_list: filteredList,
    }, { transaction: t });
    return Boolean(updated);
  });
};

/**
 * Закриває чергу, забороняючи подальші приєднання, якщо запит від власника, транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо чергу закрито, або false у разі помилки.
 */
export const closeQueue = async (queueId, owner_id) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(owner_id)) {
    return false; // Некоректні ID
  }
  return await sequelize.transaction(async (t) => {
    const queue = await queueRepo.getQueueById(queueId, { transaction: t });
    if (!queue || queue.owner_id !== owner_id || queue.is_closed) {
      return false; // Чергу не знайдено, не власник або вже закрита
    }
    const updated = await queueRepo.updateQueue(queueId, { is_closed: true }, { transaction: t });
    return Boolean(updated);
  });
};

/**
 * Передає права власника черги іншому користувачу транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} currentOwnerId - Ідентифікатор поточного власника.
 * @param {number} newOwnerId - Ідентифікатор нового власника.
 * @returns {Promise<Object|null>} Оновлений об’єкт черги або null у разі помилки.
 */
export const transferQueueOwnership = async (queueId, currentOwnerId, newOwnerId) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(currentOwnerId) || !Number.isInteger(newOwnerId)) {
    return null; // Некоректні ID
  }
  const newOwner = await userRepo.getUserById(newOwnerId);
  if (!newOwner) {
    return null; // Нового власника не знайдено
  }
  return await sequelize.transaction(async (t) => {
    const queue = await queueRepo.getQueueById(queueId, { transaction: t });
    if (!queue || queue.owner_id !== currentOwnerId) {
      return null; // Чергу не знайдено або не власник
    }
    const updated = await queueRepo.updateQueue(queueId, {
      owner_id: newOwnerId,
    }, { transaction: t });
    return updated;
  });
};

/**
 * Видаляє чергу, якщо запит від власника, транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо чергу видалено, або false у разі помилки.
 */
export const deleteQueue = async (queueId, owner_id) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(owner_id)) {
    return false; // Некоректні ID
  }
  return await sequelize.transaction(async (t) => {
    const queue = await queueRepo.getQueueById(queueId, { transaction: t });
    if (!queue || queue.owner_id !== owner_id) {
      return false; // Чергу не знайдено або не власник
    }
    const deleted = await queueRepo.deleteQueue(queueId, { transaction: t });
    return deleted;
  });
};


/**
 * Переміщує користувача на початок черги транзакційно.
 * @param {number} queueId - Ідентифікатор черги.
 * @param {number} userId - Ідентифікатор користувача.
 * @param {number} owner_id - Ідентифікатор власника черги.
 * @returns {Promise<boolean>} True, якщо користувача переміщено, або false у разі помилки.
 */
export const moveUserToFront = async (queueId, userId, owner_id) => {
  if (!Number.isInteger(queueId) || !Number.isInteger(userId) || !Number.isInteger(owner_id)) {
    
    return false; // Некоректні ID
  }
  return await sequelize.transaction(async (t) => {
    const queue = await queueRepo.getQueueById(queueId, { transaction: t });
    if (!queue || queue.owner_id !== owner_id) {
      throw new Error("Чергу не знайдено або ви не є власником");
    }
    if (queue.is_closed) {
      throw new Error("Черга закрита, переміщення неможливе");
    }
    const userIndex = queue.queue_list.indexOf(userId);
    if (userIndex === -1) {
      throw new Error("Користувача немає в черзі");
    }
    
    // Видаляємо користувача зі списку
    queue.queue_list.splice(userIndex, 1);
    // Додаємо на початок
    queue.queue_list.unshift(userId);
    
    // Оновлюємо чергу
    const updated = await queueRepo.updateQueue(queueId, {
      queue_list: queue.queue_list,
    }, { transaction: t });
    if (!updated) {
      throw new Error("Не вдалося оновити чергу");
    }

    return true;
  }).catch((error) => {

    return false; // Транзакція відкочена
  });
};