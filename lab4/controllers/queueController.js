/**
 * @fileoverview Шар контролерів для системи "Електронна черга".
 *
 * @description
 * Цей модуль обробляє HTTP-запити, пов’язані з управлінням чергами. Він взаємодіє з шаром сервісів для виконання операцій
 * і відображає сторінки через шаблони EJS для генерації HTML-відповідей на сервері.
 *
 * Реалізовані ендпоінти:
 * - GET /queues: Повертає список усіх черг.
 * - GET /queues/:id: Показує деталі конкретної черги.
 * - POST /queues: Створює нову чергу.
 * - POST /queues/:id/join: Дозволяє користувачу приєднатися до черги.
 * - GET /queues/:id/my-position: Показує позицію користувача в черзі.
 * - POST /queues/:id/next: Просуває чергу, видаляючи першого користувача (тільки власник).
 * - POST /queues/:id/remove/:userId: Видаляє конкретного користувача з черги (тільки власник).
 * - POST /queues/:id/close: Закриває чергу, забороняючи подальші приєднання (тільки власник).
 *
 * @module controllers/queueController
 *
 * @requires ../services/queueService.js - Сервісний шар для логіки управління чергами.
 * @requires ../repositories/userRepository.js - Репозиторій для доступу до даних користувачів.
 *
 * @author [Ваше Ім’я]
 * @date 2025-02-27
 */

import * as queueService from "../services/queueService.js";
import * as userRepository from "../repositories/userRepository.js";

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
    console.error("Помилка при отриманні списку черг:", error);
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
    const queue = await queueService.getQueueById(parseInt(req.params.id));
    if (queue) {
      const owner = await userRepository.getUserById(queue.owner_id);
      const queueList = await Promise.all(
        queue.queue_list.map(
          async (userId) => await userRepository.getUserById(userId)
        )
      );
      res.render("queue", { queue, owner, queue_list: queueList });
    } else {
      res.status(404).send("Queue not found");
    }
  } catch (error) {
    console.error("Помилка при отриманні черги:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Обробляє POST /queues: Створює нову чергу та перенаправляє на список черг.
 * @param {Object} req - Об’єкт запиту Express із name та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на '/queues'.
 */
export const createQueue = (req, res) => {
  const { name, owner_id } = req.body;
  queueService.createQueue(name, parseInt(owner_id));
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
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Повертає ім’я наступного користувача або 400 у разі помилки.
 */
export const nextInQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const { owner_id } = req.body;
  const nextUserId = queueService.nextInQueue(queueId, parseInt(owner_id));
  if (nextUserId) {
    const nextUser = userRepository.getUserById(nextUserId);
    res.send(`Next user: ${nextUser.name}`);
  } else {
    res.status(400).send("Failed to call next user");
  }
};

/**
 * Обробляє POST /queues/:id/remove/:userId: Видаляє користувача з черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги та userId у params, owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const removeUserFromQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { owner_id } = req.body;
  const success = queueService.removeUserFromQueue(
    queueId,
    userId,
    parseInt(owner_id)
  );
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Failed to remove user");
  }
};

/**
 * Обробляє POST /queues/:id/close: Закриває чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає 400 у разі помилки.
 */
export const closeQueue = (req, res) => {
  const queueId = parseInt(req.params.id);
  const { owner_id } = req.body;
  const success = queueService.closeQueue(queueId, parseInt(owner_id));
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Failed to close queue");
  }
};
