import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const MaintenanceRequest = sequelize.define("MaintenanceRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  issueType: { type: DataTypes.STRING, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  priority: { type: DataTypes.STRING, defaultValue: "Medium" },
  status: { type: DataTypes.STRING, defaultValue: "Open" },
  submittedBy: { type: DataTypes.STRING, allowNull: true },
  submittedByUserId: { type: DataTypes.STRING, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  adminRemarks: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "workspace_maintenance_requests",
  timestamps: true,
  underscored: true,
  updatedAt: "updated_at",
  createdAt: "created_at",
});

export { MaintenanceRequest };
