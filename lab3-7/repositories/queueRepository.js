let queues = [
  { id: 1, name: "Черга 1", ownerId: 1, isClosed: false, queueList: [2, 3] },
  { id: 2, name: "Черга 2", ownerId: 2, isClosed: false, queueList: [] },
];
let nextId = 3;

export function getAllQueues() {
  return queues;
}

export function getQueueById(id) {
  return queues.find((q) => q.id === id);
}

export function createQueue(queue) {
  const newQueue = { id: nextId++, ...queue };
  queues.push(newQueue);
  return newQueue;
}

export function updateQueue(id, updatedQueue) {
  const index = queues.findIndex((q) => q.id === id);
  if (index !== -1) {
    queues[index] = { ...queues[index], ...updatedQueue };
    return queues[index];
  }
  return null;
}
