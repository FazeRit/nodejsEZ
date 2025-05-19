import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

let sequelize;

const dbConfig = {
  url: process.env.DB_URL,
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
};

if (dbConfig.url) {
  sequelize = new Sequelize(dbConfig.url.toString(), {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: dbConfig.ssl,
    },
  });
} else {
  sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: dbConfig.ssl,
    },
  });
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default sequelize;
