import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const RegistrarRequest = sequelize.define("RegistrarRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM("transcript","bonafide","migration","degree","other"), allowNull: false },
  purpose: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("pending","processing","ready","delivered","rejected"), defaultValue: "pending" },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  copies: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { tableName: "registrar_requests", timestamps: true });

const LorRequest = sequelize.define("LorRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  professor_id: { type: DataTypes.UUID, allowNull: true },
  purpose: { type: DataTypes.TEXT, allowNull: true },
  university: { type: DataTypes.STRING, allowNull: true },
  deadline: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.ENUM("pending","accepted","rejected","completed"), defaultValue: "pending" },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  meeting_time: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "lor_requests", timestamps: true });

export { RegistrarRequest, LorRequest };