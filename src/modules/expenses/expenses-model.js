import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Expense = sequelize.define("Expense", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  amount_spent: { type: DataTypes.FLOAT, allowNull: true },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
  receipt_link: { type: DataTypes.STRING, allowNull: true },
  proof_doc_link: { type: DataTypes.STRING, allowNull: true },
  proof_doc_file: { type: DataTypes.JSON, allowNull: true },
  adminComments: { type: DataTypes.TEXT, allowNull: true },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
  previousVersion: { type: DataTypes.JSON, allowNull: true },
}, { tableName: "workspace_expenses", timestamps: true, underscored: true });

export { Expense };
