import sequelize from '../config/db.js';
import { Queue } from './queue.js';
import { User } from './user.js';

Queue.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner',
});

User.hasMany(Queue, {
  foreignKey: 'owner_id',
  as: 'queues',
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized.');
  } catch (error) {
    console.error('Error connecting to or synchronizing with the database:', error);
    process.exit(1);
  }
})();

export { User, Queue, sequelize };