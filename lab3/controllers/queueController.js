import * as queueService from "../services/queueService.js";
import * as userRepository from "../repositories/userRepository.js";

/**
 * Обробляє GET /queues: Відображає список усіх черг.
 * @param {Object} req - Об’єкт запиту Express.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Рендерить шаблон 'queues' зі списком черг.
 */
export const getAllQueues = (req, res) => {
  const queues = queueService.getAllQueues();
  res.render("queues", { queues });
};

/**
 * Обробляє GET /queues/:id: Відображає деталі конкретної черги.
 * @param {Object} req - Об’єкт запиту Express із параметром id черги.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Рендерить шаблон 'queue' із даними черги або повертає 404, якщо черги немає.
 */
export const getQueueById = (req, res) => {
  const queue = queueService.getQueueById(parseInt(req.params.id));
  if (queue) {
    const owner = userRepository.getUserById(queue.ownerId);
    const queueList = queue.queueList.map((userId) =>
      userRepository.getUserById(userId)
    );
    res.render("queue", { queue, owner, queueList });
  } else {
    res.status(404).send("Queue not found");
  }
};

/**
 * Обробляє POST /queues: Створює нову чергу та перенаправляє на список черг.
 * @param {Object} req - Об’єкт запиту Express із name та ownerId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на '/queues'.
 */
export const createQueue = (req, res) => {
  const { name, ownerId } = req.body;
  queueService.createQueue(name, parseInt(ownerId));
  res.redirect("/queues");
};

/**
 * Обробляє POST /queues/:id/join: Дозволяє користувачу приєднатися до черги.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const joinQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const { userId } = req.body;
  const success = queueService.joinQueue(queueId, parseInt(userId));
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Failed to join the queue");
  }
};

/**
 * Обробляє GET /queues/:id/my-position: Показує позицію користувача в черзі.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у query.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Рендерить шаблон 'position' або повертає 404, якщо користувача немає в черзі.
 */
export const getUserPosition = (req, res) => {
  const queueId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId);
  const position = queueService.getUserPosition(queueId, userId);
  if (position !== null) {
    res.render("position", { position });
  } else {
    res.status(404).send("User not found in queue");
  }
};

/**
 * Обробляє POST /queues/:id/next: Просуває чергу, видаляючи першого користувача (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та ownerId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Повертає ім’я наступного користувача або 400 у разі помилки.
 */
export const nextInQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const { ownerId } = req.body;
  const nextUserId = queueService.nextInQueue(queueId, parseInt(ownerId));
  if (nextUserId) {
    const nextUser = userRepository.getUserById(nextUserId);
    res.send(`Next user: ${nextUser.name}`);
  } else {
    res.status(400).send("Failed to call next user");
  }
};

/**
 * Обробляє POST /queues/:id/remove/:userId: Видаляє користувача з черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги та userId у params, ownerId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const removeUserFromQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { ownerId } = req.body;
  const success = queueService.removeUserFromQueue(
    queueId,
    userId,
    parseInt(ownerId)
  );
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Failed to remove user");
  }
};

/**
 * Обробляє POST /queues/:id/close: Закриває чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та ownerId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const closeQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const { ownerId } = req.body;
  const success = queueService.closeQueue(queueId, parseInt(ownerId));
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Failed to close queue");
  }
};
