// src/modules/cohort-resources/cohort-resources-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const ResourceWeek = sequelize.define("ResourceWeek", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id: { type: DataTypes.STRING, allowNull: false },
  title:     { type: DataTypes.STRING, allowNull: false },
  dateRange: { type: DataTypes.STRING, allowNull: true },
  order:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: "resource_weeks", timestamps: true, underscored: true,
     indexes: [{ fields: ["cohort_id"] }] });

const CohortResource = sequelize.define("CohortResource", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  week_id:     { type: DataTypes.UUID, allowNull: false },
  cohort_id:   { type: DataTypes.STRING, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  url:         { type: DataTypes.STRING, allowNull: true },
  type:        { type: DataTypes.STRING, defaultValue: "link" },
  description: { type: DataTypes.TEXT, allowNull: true },
  order:       { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: "cohort_resources", timestamps: true, underscored: true,
     indexes: [{ fields: ["week_id"] }, { fields: ["cohort_id"] }] });

ResourceWeek.hasMany(CohortResource, { foreignKey: "week_id", as: "resources" });
CohortResource.belongsTo(ResourceWeek, { foreignKey: "week_id" });

export { ResourceWeek, CohortResource };