import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

export class Queue extends Model {}

Queue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_closed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    queue_list: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: "queues",
    timestamps: false,
  }
);
