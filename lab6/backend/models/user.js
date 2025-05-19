import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

export class User extends Model {}

User.init(
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
  },
  {
    sequelize,
    tableName: "people",
    timestamps: false,
  }
);

export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
  });

  User.associate = (models) => {
    User.hasMany(models.Queue, { foreignKey: 'userId' });
  };

  return User;
};
