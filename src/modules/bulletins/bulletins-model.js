import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Bulletin = sequelize.define("Bulletin", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  level: { type: DataTypes.STRING, defaultValue: "institution" },
  category: { type: DataTypes.STRING, allowNull: true },
  priority: { type: DataTypes.STRING, defaultValue: "Normal" },
  is_pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
  author: { type: DataTypes.STRING, defaultValue: "Placement Cell" },
  attachments: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
}, { tableName: "workspace_bulletins", timestamps: true, underscored: true });

export { Bulletin };
