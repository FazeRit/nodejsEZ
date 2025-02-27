import {
  getAllQueues as _getAllQueues,
  getQueueById as _getQueueById,
  createQueue as _createQueue,
  updateQueue,
} from "../repositories/queueRepository.js";

export function getAllQueues() {
  return _getAllQueues();
}

export function getQueueById(id) {
  return _getQueueById(id);
}

export function createQueue(name, ownerId) {
  const queue = { name, ownerId, isClosed: false, queueList: [] };
  return _createQueue(queue);
}

export function joinQueue(queueId, userId) {
  const queue = _getQueueById(queueId);
  if (queue && !queue.isClosed && !queue.queueList.includes(userId)) {
    queue.queueList.push(userId);
    updateQueue(queueId, queue);
    return true;
  }
  return false;
}

export function getUserPosition(queueId, userId) {
  const queue = _getQueueById(queueId);
  if (queue) {
    const position = queue.queueList.indexOf(userId);
    if (position !== -1) return position + 1;
  }
  return null;
}

export function nextInQueue(queueId, ownerId) {
  const queue = _getQueueById(queueId);
  if (queue && queue.ownerId === ownerId && queue.queueList.length > 0) {
    const nextUser = queue.queueList.shift();
    updateQueue(queueId, queue);
    return nextUser;
  }
  return null;
}

export function removeUserFromQueue(queueId, userId, ownerId) {
  const queue = _getQueueById(queueId);
  if (queue && queue.ownerId === ownerId) {
    const index = queue.queueList.indexOf(userId);
    if (index !== -1) {
      queue.queueList.splice(index, 1);
      updateQueue(queueId, queue);
      return true;
    }
  }
  return false;
}

export function closeQueue(queueId, ownerId) {
  const queue = _getQueueById(queueId);
  if (queue && queue.ownerId === ownerId) {
    queue.isClosed = true;
    updateQueue(queueId, queue);
    return true;
  }
  return false;
}
