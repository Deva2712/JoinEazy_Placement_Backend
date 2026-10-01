import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

export const Fee = sequelize.define("Fee", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  fee_head: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  due_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("paid", "unpaid", "partial"), defaultValue: "unpaid" },
  paid_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { tableName: "fees", timestamps: true });

export const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  fee_id: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  mode: { type: DataTypes.STRING, allowNull: false },
  transaction_id: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM("success", "failed", "pending"), defaultValue: "success" },
}, { tableName: "payments", timestamps: true });

export const Receipt = sequelize.define("Receipt", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  payment_id: { type: DataTypes.UUID, allowNull: false },
  receipt_url: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "receipts", timestamps: true });