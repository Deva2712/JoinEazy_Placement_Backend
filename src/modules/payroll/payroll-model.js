import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const PayrollRecord = sequelize.define("PayrollRecord", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  month: { type: DataTypes.STRING, allowNull: false, unique: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "Paid" },
  paidAt: { type: DataTypes.DATEONLY, allowNull: true },
  breakdown: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
}, {
  tableName: "workspace_payroll_records",
  timestamps: true,
  underscored: true,
});

export { PayrollRecord };
