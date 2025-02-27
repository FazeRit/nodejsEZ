let users = [
  { id: 1, name: "Власник1" },
  { id: 2, name: "Користувач1" },
  { id: 3, name: "Користувач2" },
];

export function getUserById(id) {
  return users.find((u) => u.id === id);
}
