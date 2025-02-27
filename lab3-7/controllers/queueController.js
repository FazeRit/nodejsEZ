import {
  getAllQueues as _getAllQueues,
  getQueueById as _getQueueById,
  createQueue as _createQueue,
  joinQueue as _joinQueue,
  getUserPosition as _getUserPosition,
  nextInQueue as _nextInQueue,
  removeUserFromQueue as _removeUserFromQueue,
  closeQueue as _closeQueue,
} from "../services/queueService.js";
import { getUserById } from "../repositories/userRepository.js";

export function getAllQueues(req, res) {
  const queues = _getAllQueues();
  res.render("queues", { queues });
}

export function getQueueById(req, res) {
  const queue = _getQueueById(parseInt(req.params.id));
  if (queue) {
    const owner = getUserById(queue.ownerId);
    const queueList = queue.queueList.map((userId) => getUserById(userId));
    res.render("queue", { queue, owner, queueList });
  } else {
    res.status(404).send("Чергу не знайдено");
  }
}

export function createQueue(req, res) {
  const { name, ownerId } = req.body;
  _createQueue(name, parseInt(ownerId));
  res.redirect("/queues");
}

export function joinQueue(req, res) {
  const queueId = parseInt(req.params.id);
  const { userId } = req.body;
  const success = _joinQueue(queueId, parseInt(userId));
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Не вдалося приєднатися до черги");
  }
}

export function getUserPosition(req, res) {
  const queueId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId);
  const position = _getUserPosition(queueId, userId);
  if (position !== null) {
    res.render("position", { position });
  } else {
    res.status(404).send("Користувача немає в черзі");
  }
}

export function nextInQueue(req, res) {
  const queueId = parseInt(req.params.id);
  const { ownerId } = req.body;
  const nextUserId = _nextInQueue(queueId, parseInt(ownerId));
  if (nextUserId) {
    const nextUser = getUserById(nextUserId);
    res.send(`Наступний користувач: ${nextUser.name}`);
  } else {
    res.status(400).send("Не вдалося викликати наступного");
  }
}

export function removeUserFromQueue(req, res) {
  const queueId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { ownerId } = req.body;
  const success = _removeUserFromQueue(queueId, userId, parseInt(ownerId));
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Не вдалося видалити користувача");
  }
}

export function closeQueue(req, res) {
  const queueId = parseInt(req.params.id);
  const { ownerId } = req.body;
  const success = _closeQueue(queueId, parseInt(ownerId));
  if (success) {
    res.redirect(`/queues/${queueId}`);
  } else {
    res.status(400).send("Не вдалося закрити чергу");
  }
}
