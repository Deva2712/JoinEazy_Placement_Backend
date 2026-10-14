import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Department = sequelize.define("Department", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  hod_id: { type: DataTypes.UUID, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "departments", timestamps: true });

export default Department;
