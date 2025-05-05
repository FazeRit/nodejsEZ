import * as queueService from "../services/queueService.js";
import * as userRepo from "../repositories/userRepository.js";

/**
 * Обробляє GET /queues: Відображає список усіх черг.
 * @param {Object} req - Об’єкт запиту Express.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Рендерить шаблон 'queues' зі списком черг.
 */
export const getAllQueues = async (req, res) => {
  try {
    const queues = await queueService.getAllQueues();
    res.render("queues", { queues });
  } catch (error) {
    console.error("Error fetching queues:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє GET /queues/:id: Відображає деталі конкретної черги.
 * @param {Object} req - Об’єкт запиту Express із параметром id черги.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Рендерить шаблон 'queue' із даними черги або повертає 404, якщо черги немає.
 */
export const getQueueById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const queue = await queueService.getQueueById(id);
    if (!queue) {
      return res.status(404).send("Queue not found");
    }
    const owner = await userRepo.getUserById(queue.owner_id);
    const queueUsers = await Promise.all(
      queue.queue_list.map((uid) => userRepo.getUserById(uid))
    );
    res.render("queue", { queue, owner, queue_list: queueUsers });
  } catch (error) {
    console.error(`Error fetching queue ${req.params.id}:`, error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє POST /queues: Створює нову чергу та перенаправляє на список черг.
 * @param {Object} req - Об’єкт запиту Express із name та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на '/'.
 */
export const createQueue = async (req, res) => {
  try {
    const { name, ownerId } = req.body;
    const queue = await queueService.createQueue({
      name,
      owner_id: parseInt(ownerId, 10),
    });
    if (!queue) {
      return res.status(400).send("Failed to create queue");
    }
    res.redirect("/");
  } catch (error) {
    console.error("Error creating queue:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє POST /queues/:id/join: Дозволяє користувачу приєднатися до черги.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const joinQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.userId, 10);
    const success = await queueService.joinQueue(queueId, userId);
    if (success) {
      return res.redirect(`/${queueId}`);
    }
    res.status(400).send("Failed to join queue");
  } catch (error) {
    console.error("Error joining queue:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє GET /queues/:id/my-position: Показує позицію користувача в черзі.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у query.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Рендерить шаблон 'position' або повертає 404, якщо користувача немає в черзі.
 */
export const getUserPosition = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    const userId = parseInt(req.query.userId, 10);
    const pos = await queueService.getUserPosition(queueId, userId);
    if (pos === null) {
      return res.status(404).send("User not in queue");
    }
    res.render("position", { position: pos });
  } catch (error) {
    console.error("Error getting user position:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє POST /queues/:id/next: Просуває чергу, видаляючи першого користувача (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Повертає ім’я наступного користувача або 400 у разі помилки.
 */
export const nextInQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    const ownerId = parseInt(req.body.ownerId, 10);
    const result = await queueService.nextInQueue(queueId, ownerId);
    if (!result) {
      return res.status(400).send("Failed to advance queue");
    }
    const nextUser = await userRepo.getUserById(result.nextUser + 1);
    if (!nextUser) {
      return res.status(404).send("Next user not found");
    }
    res.send(`Next user: ${nextUser.name}`);
  } catch (error) {
    console.error("Error advancing queue:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє POST /queues/:id/remove/:userId: Видаляє користувача з черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги та userId у params, owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const removeUserFromQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);
    const ownerId = parseInt(req.body.ownerId, 10);
    const success = await queueService.removeUserFromQueue(
      queueId,
      userId,
      ownerId
    );
    if (success) {
      return res.redirect(`/${queueId}`);
    }
    res.status(400).send("Failed to remove user");
  } catch (error) {
    console.error("Error removing user from queue:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє POST /queues/:id/close: Закриває чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const closeQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    const ownerId = parseInt(req.body.ownerId, 10);
    const success = await queueService.closeQueue(queueId, ownerId);
    if (success) {
      return res.redirect(`/${queueId}`);
    }
    res.status(400).send("Failed to close queue");
  } catch (error) {
    console.error("Error closing queue:", error);
    res.status(500).send("Internal Server Error");
  }
};
