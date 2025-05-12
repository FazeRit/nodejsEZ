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
    const { page = 1, limit = 10, q = "" } = req.query;
    const { queues, totalPages } = await queueService.getFilteredQueues(
      parseInt(page, 10),
      parseInt(limit, 10),
      q
    );

    if (!queues) {
      return res.status(404).render("queues", {
        queues: [],
        error: "Черги не знайдені",
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: 0,
        q,
      });
    }

    res.render("queues", {
      queues,
      totalPages,
      error: null,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
    });
  } catch (error) {
    console.error("Error fetching queues:", error);
    res.status(500).render("queues", {
      queues: [],
      error: "Не вдалося отримати список черг",
      page: 1,
      limit: 10,
      totalPages: 0,
      q: "",
    });
  }
};
/**
 * Обробляє GET /queues/:id: Відображає деталі конкретної черги.
 * @param {Object} req - Об’єкт запиту Express із параметром id черги.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {Promise<void>} Рендерить шаблон 'queue' із даними черги або повертає помилку.
 */
export const getQueueById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).render("queue", { queue: null, owner: null, queue_list: [], error: "Некоректний ID черги" });
    }
    const queue = await queueService.getQueueById(id);
    if (!queue) {
      return res.status(404).render("queue", { queue: null, owner: null, queue_list: [], error: "Чергу не знайдено" });
    }
    const owner = await userRepo.getUserById(queue.owner_id);
    if (!owner) {
      return res.status(404).render("queue", { queue, owner: null, queue_list: [], error: "Власника черги не знайдено" });
    }
    const queueUsers = await Promise.all(
      queue.queue_list.map(async (uid) => {
        const user = await userRepo.getUserById(uid);
        return user || { name: "Користувач не знайдений", id: uid };
      })
    );
    res.render("queue", { queue, owner, queue_list: queueUsers, error: null });
  } catch (error) {
    console.error(`Error fetching queue ${req.params.id}:`, error);
    res.status(500).render("queue", { queue: null, owner: null, queue_list: [], error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє POST /queues: Створює нову чергу та перенаправляє на список черг.
 * @param {Object} req - Об’єкт запиту Express із name та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на '/' або повертає помилку.
 */
export const createQueue = async (req, res) => {
  try {
    const { name, ownerId } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).render("queues", { queues: await queueService.getAllQueues(), error: "Назва черги не може бути порожньою" });
    }
    if (name.length > 100) {
      return res.status(400).render("queues", { queues: await queueService.getAllQueues(), error: "Назва черги занадто довга (макс. 100 символів)" });
    }
    const owner_id = parseInt(ownerId, 10);
    if (isNaN(owner_id)) {
      return res.status(400).render("queues", { queues: await queueService.getAllQueues(), error: "Некоректний ID власника" });
    }
    const owner = await userRepo.getUserById(owner_id);
    if (!owner) {
      return res.status(404).render("queues", { queues: await queueService.getAllQueues(), error: "Власника з таким ID не знайдено" });
    }
    const queue = await queueService.createQueue({ name, owner_id });
    if (!queue) {
      return res.status(400).render("queues", { queues: await queueService.getAllQueues(), error: "Не вдалося створити чергу" });
    }
    res.redirect("/");
  } catch (error) {
    console.error("Error creating queue:", error);
    res.status(500).render("queues", { queues: await queueService.getAllQueues(), error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє POST /queues/:id/join: Дозволяє користувачу приєднатися до черги.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає помилку.
 */
export const joinQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).render("queue", { queue: null, owner: null, queue_list: [], error: "Некоректний ID черги" });
    }
    const userId = parseInt(req.body.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Некоректний ID користувача" });
    }
    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Користувача з таким ID не знайдено" });
    }
    const success = await queueService.joinQueue(queueId, userId);
    if (!success) {
      return res.status(400).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Не вдалося приєднатися до черги: можливо, черга закрита або користувач уже в черзі" });
    }
    res.redirect(`/${queueId}`);
  } catch (error) {
    console.error("Error joining queue:", error);
    res.status(500).render("queue", { queue: null, owner: null, queue_list: [], error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє GET /queues/:id/my-position: Показує позицію користувача в черзі.
 * @param {Object} req - Об’єкт запиту Express із id черги в params та userId у query.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Рендерить шаблон 'position' або повертає помилку.
 */
export const getUserPosition = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).render("position", { position: null, error: "Некоректний ID черги" });
    }
    const userId = parseInt(req.query.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).render("position", { position: null, error: "Некоректний ID користувача" });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).render("position", { position: null, error: "Чергу не знайдено" });
    }
    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).render("position", { position: null, error: "Користувача не знайдено" });
    }
    const pos = await queueService.getUserPosition(queueId, userId);
    if (pos === null) {
      return res.status(404).render("position", { position: null, error: "Користувача немає в черзі" });
    }
    res.render("position", { position: pos, error: null });
  } catch (error) {
    console.error("Error getting user position:", error);
    res.status(500).render("position", { position: null, error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє POST /queues/:id/next: Просуває чергу, видаляючи першого користувача (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об hect відповіді Express.
 * @returns {void} Повертає ім’я наступного користувача або помилку.
 */
export const nextInQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).send("Некоректний ID черги");
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).send("Некоректний ID власника");
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).send("Чергу не знайдено");
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).send("Дія дозволена лише власнику черги");
    }
    const result = await queueService.nextInQueue(queueId, ownerId);
    if (!result) {
      return res.status(400).send("Не вдалося просувати чергу: можливо, черга порожня");
    }
    const nextUser = await userRepo.getUserById(result.nextUser);
    if (!nextUser) {
      return res.status(404).send("Наступного користувача не знайдено");
    }
    res.send(`Next user: ${nextUser.name}`);
  } catch (error) {
    console.error("Error advancing queue:", error);
    res.status(500).send("Внутрішня помилка сервера");
  }
};

/**
 * Обробляє POST /queues/:id/remove/:userId: Видаляє користувача з черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги та userId у params, owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає помилку.
 */
export const removeUserFromQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).render("queue", { queue: null, owner: null, queue_list: [], error: "Некоректний ID черги" });
    }
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Некоректний ID користувача" });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Некоректний ID власника" });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).render("queue", { queue: null, owner: null, queue_list: [], error: "Чергу не знайдено" });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Дія дозволена лише власнику черги" });
    }
    const user = await userRepo.getUserById(userId);
    if (!user) {
      return res.status(404).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Користувача не знайдено" });
    }
    const success = await queueService.removeUserFromQueue(queueId, userId, ownerId);
    if (!success) {
      return res.status(400).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Не вдалося видалити користувача: можливо, його немає в черзі" });
    }
    res.redirect(`/${queueId}`);
  } catch (error) {
    console.error("Error removing user from queue:", error);
    res.status(500).render("queue", { queue: null, owner: null, queue_list: [], error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє POST /queues/:id/close: Закриває чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає помилку.
 */
export const closeQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).render("queue", { queue: null, owner: null, queue_list: [], error: "Некоректний ID черги" });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Некоректний ID власника" });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).render("queue", { queue: null, owner: null, queue_list: [], error: "Чергу не знайдено" });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Дія дозволена лише власнику черги" });
    }
    if (queue.is_closed) {
      return res.status(400).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Черга вже закрита" });
    }
    const success = await queueService.closeQueue(queueId, ownerId);
    if (!success) {
      return res.status(400).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Не вдалося закрити чергу" });
    }
    res.redirect(`/${queueId}`);
  } catch (error) {
    console.error("Error closing queue:", error);
    res.status(500).render("queue", { queue: null, owner: null, queue_list: [], error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє POST /queues/:id/delete: Видаляє чергу (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги в params та owner_id у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на головну сторінку або повертає помилку.
 */
export const deleteQueue = async (req, res) => {
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId)) {
      return res.status(400).render("queue", { queue: null, owner: null, queue_list: [], error: "Некоректний ID черги" });
    }
    const ownerId = parseInt(req.body.ownerId, 10);
    if (isNaN(ownerId)) {
      return res.status(400).render("queue", { queue: await queueService.getQueueById(queueId), owner: null, queue_list: [], error: "Некоректний ID власника" });
    }
    const queue = await queueService.getQueueById(queueId);
    if (!queue) {
      return res.status(404).render("queue", { queue: null, owner: null, queue_list: [], error: "Чергу не знайдено" });
    }
    if (queue.owner_id !== ownerId) {
      return res.status(403).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Дія дозволена лише власнику черги" });
    }
    const success = await queueService.deleteQueue(queueId, ownerId);
    if (!success) {
      return res.status(400).render("queue", { queue, owner: await userRepo.getUserById(queue.owner_id), queue_list: [], error: "Не вдалося видалити чергу" });
    }
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting queue:", error);
    res.status(500).render("queue", { queue: null, owner: null, queue_list: [], error: "Внутрішня помилка сервера" });
  }
};

/**
 * Обробляє POST /queues/:id/move-to-front: Переміщує користувача на початок черги (тільки власник).
 * @param {Object} req - Об’єкт запиту Express із id черги у params, owner_id та userId у body.
 * @param {Object} res - Об’єкт відповіді Express.
 * @returns {void} Перенаправляє на сторінку черги або повертає помилку.
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
	  return res.status(400).render("queue", {
		queue: await queueService.getQueueById(queueId),
		owner: null,
		queue_list: [],
		error: Object.values(errorMessages).filter(Boolean).join(", "),
	  });
	}

	const queue = await queueService.getQueueById(queueId);
	if (!queue) {
	  return res.status(404).render("queue", {
		queue: null,
		owner: null,
		queue_list: [],
		error: "Чергу не знайдено",
	  });
	}

	if (queue.owner_id !== ownerId) {
	  return res.status(403).render("queue", {
		queue,
		owner: await userRepo.getUserById(queue.owner_id),
		queue_list: [],
		error: "Дія дозволена лише власнику черги",
	  });
	}

	const user = await userRepo.getUserById(userId);
	if (!user) {
	  return res.status(404).render("queue", {
		queue,
		owner: await userRepo.getUserById(queue.owner_id),
		queue_list: [],
		error: "Користувача не знайдено",
	  });
	}

	const success = await queueService.moveUserToFront(queueId, userId, ownerId);
	if (!success) {
	  return res.status(400).render("queue", {
		queue,
		owner: await userRepo.getUserById(queue.owner_id),
		queue_list: [],
		error: "Не вдалося перемістити користувача: можливо, черга закрита або користувача немає в черзі",
	  });
	}
    res.redirect(`/${queueId}`);
  } catch (error) {
    console.error("Error moving user to front of queue:", error);
    res.status(500).render("queue", { queue: null, owner: null, queue_list: [], error: "Внутрішня помилка сервера" });
  }
};