import * as queueService from "../services/queueService.js";
import * as userRepo from "../repositories/userRepository.js";

/**
 * Обробляє GET /queues: Повертає список усіх черг у JSON.
 * @param {Object} req - Об’єкт запиту Express.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON зі списком черг.
 */
export const getAllQueues = async (req, res) => {
	console.log('Handling /queues request with params:', req.params, 'and query:', req.query); // Debug log
	try {
	  const page = parseInt(req.query.page, 10) || 1;
	  const limit = parseInt(req.query.limit, 10) || 10;
	  const q = req.query.q ? String(req.query.q).trim() : '';
  
	  if (page < 1 || isNaN(page)) {
		return res.status(400).json({ success: false, error: 'Номер сторінки має бути позитивним цілим числом', data: { queues: [], page: 1, limit, totalPages: 0 } });
	  }
	  if (limit < 1 || isNaN(limit)) {
		return res.status(400).json({ success: false, error: 'Ліміт має бути позитивним цілим числом', data: { queues: [], page, limit: 10, totalPages: 0 } });
	  }
  
	  const { queues, totalPages } = await queueService.getFilteredQueues(page, limit, q);
	  res.json({ success: true, data: { queues: queues || [], totalPages: totalPages || 0, page, limit, q } });
	} catch (error) {
	  console.error('Error fetching queues:', error);
	  res.status(500).json({ success: false, error: 'Не вдалося отримати список черг', data: { queues: [], page: 1, limit: 10, totalPages: 0 } });
	}
  };

/**
 * Обробляє GET /queues/:id: Повертає деталі конкретної черги у JSON.
 * @param {Object} req - Об’єкт запиту Express із параметром id черги.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із даними черги.
 */
export const getQueueById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const queue = await queueService.getQueueById(id);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }
    const owner = await userRepo.getUserById(queue.owner_id);
    if (!owner) {
      return res.status(404).json({ success: false, error: "Власника черги не знайдено", data: { queue, owner: null } });
    }
    const queueUsers = await Promise.all(
      queue.queue_list.map(async (uid) => {
        const user = await userRepo.getUserById(uid);
        return user || { name: "Користувач не знайдений", id: uid };
      })
    );
    res.json({ success: true, data: { queue, owner, queue_list: queueUsers } });
  } catch (error) {
    console.error(`Error fetching queue ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues: Створює нову чергу та повертає результат у JSON.
 * @param {Object} req - Об’єкт запиту Express із name та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із результатом створення черги.
 */
export const createQueue = async (req, res) => {
  try {
    const { name, ownerId } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Назва черги не може бути порожньою", data: null });
    }
    if (name.length > 100) {
      return res.status(400).json({ success: false, error: "Назва черги занадто довга (макс. 100 символів)", data: null });
    }
    const owner_id = parseInt(ownerId, 10);
    if (isNaN(owner_id)) {
      return res.status(400).json({ success: false, error: "Некоректний ID власника", data: null });
    }
    const owner = await userRepo.getUserById(owner_id);
    if (!owner) {
      return res.status(404).json({ success: false, error: "Власника з таким ID не знайдено", data: null });
    }
    const queue = await queueService.createQueue({ name, owner_id });
    if (!queue) {
      return res.status(400).json({ success: false, error: "Не вдалося створити чергу", data: null });
    }
    res.status(201).json({ success: true, data: { queue } });
  } catch (error) {
    console.error("Error creating queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues/:id/join: Дозволяє користувачу приєднатися до черги.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із результатом приєднання.
 */
export const joinQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const userId = parseInt(req.body.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID користувача", data: null });
    }
    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Користувача з таким ID не знайдено", data: null });
    }
    const success = await queueService.joinQueue(queueId, userId);
    if (!success) {
      return res.status(400).json({ success: false, error: "Не вдалося приєднатися до черги: можливо, черга закрита або користувач уже в черзі", data: null });
    }
    res.json({ success: true, data: { queueId, userId } });
  } catch (error) {
    console.error("Error joining queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє GET /queues/:id/my-position: Повертає позицію користувача в черзі у JSON.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у query.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із позицією.
 */
export const getUserPosition = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const userId = parseInt(req.query.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID користувача", data: null });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }
    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Користувача не знайдено", data: null });
    }
    const pos = await queueService.getUserPosition(queueId, userId);
    if (pos === null) {
      return res.status(404).json({ success: false, error: "Користувача немає в черзі", data: null });
    }
    res.json({ success: true, data: { position: pos } });
  } catch (error) {
    console.error("Error getting user position:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues/:id/next: Просуває чергу, видаляючи першого користувача (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із наступним користувачем.
 */
export const nextInQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID власника", data: null });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: "Дія дозволена лише власнику черги", data: null });
    }
    const result = await queueService.nextInQueue(queueId, ownerId);
    if (!result) {
      return res.status(400).json({ success: false, error: "Не вдалося просувати чергу: можливо, черга порожня", data: null });
    }
    const nextUser = await userRepo.getUserById(result.nextUser);
    if (!nextUser) {
      return res.status(404).json({ success: false, error: "Наступного користувача не знайдено", data: null });
    }
    res.json({ success: true, data: { nextUser: nextUser.name } });
  } catch (error) {
    console.error("Error advancing queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues/:id/remove/:userId: Видаляє користувача з черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги та userId у params, owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із результатом видалення.
 */
export const removeUserFromQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID користувача", data: null });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID власника", data: null });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: "Дія дозволена лише власнику черги", data: null });
    }
    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Користувача не знайдено", data: null });
    }
    const success = await queueService.removeUserFromQueue(queueId, userId, ownerId);
    if (!success) {
      return res.status(400).json({ success: false, error: "Не вдалося видалити користувача: можливо, його немає в черзі", data: null });
    }
    res.json({ success: true, data: { queueId, userId } });
  } catch (error) {
    console.error("Error removing user from queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues/:id/close: Закриває чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із результатом закриття.
 */
export const closeQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID власника", data: null });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: "Дія дозволена лише власнику черги", data: null });
    }
    if (queue.is_closed) {
      return res.status(400).json({ success: false, error: "Черга вже закрита", data: null });
    }
    const success = await queueService.closeQueue(queueId, ownerId);
    if (!success) {
      return res.status(400).json({ success: false, error: "Не вдалося закрити чергу", data: null });
    }
    res.json({ success: true, data: { queueId } });
  } catch (error) {
    console.error("Error closing queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues/:id/delete: Видаляє чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із результатом видалення.
 */
export const deleteQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID черги", data: null });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).json({ success: false, error: "Некоректний ID власника", data: null });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: "Дія дозволена лише власнику черги", data: null });
    }
    const success = await queueService.deleteQueue(queueId, ownerId);
    if (!success) {
      return res.status(400).json({ success: false, error: "Не вдалося видалити чергу", data: null });
    }
    res.json({ success: true, data: { queueId } });
  } catch (error) {
    console.error("Error deleting queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};

/**
 * Обробляє POST /queues/:id/move-to-front: Переміщує користувача на початок черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги у params, owner_id та userId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Повертає JSON із результатом переміщення.
 */
export const moveUserToFront = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId, 10);
    const ownerId = parseInt(req.body.ownerId, 10);

    if ([queueId, userId, ownerId].some(isNaN)) {
      const errorMessages = {
        queueId: isNaN(queueId) ? "Некоректний ID черги" : null,
        userId: isNaN(userId) ? "Некоректний ID користувача" : null,
        ownerId: isNaN(ownerId) ? "Некоректний ID власника" : null,
      };
      return res.status(400).json({ success: false, error: Object.values(errorMessages).filter(Boolean).join(", "), data: null });
    }

    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: "Чергу не знайдено", data: null });
    }

    if (queue.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: "Дія дозволена лише власнику черги", data: null });
    }

    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Користувача не знайдено", data: null });
    }

    const success = await queueService.moveUserToFront(queueId, userId, ownerId);
    if (!success) {
      return res.status(400).json({ success: false, error: "Не вдалося перемістити користувача: можливо, черга закрита або користувача немає в черзі", data: null });
    }
    res.json({ success: true, data: { queueId, userId } });
  } catch (error) {
    console.error("Error moving user to front of queue:", error);
    res.status(500).json({ success: false, error: "Внутрішня помилка сервера", data: null });
  }
};