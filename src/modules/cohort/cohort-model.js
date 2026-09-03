import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Cohort = sequelize.define("Cohort", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  kind: { type: DataTypes.STRING, defaultValue: "created" },
}, { tableName: "workspace_cohorts", timestamps: true, underscored: true });

const CohortAnnouncement = sequelize.define("CohortAnnouncement", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohortId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: true },
  priority: { type: DataTypes.STRING, defaultValue: "Normal" },
  attachments: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  author_name: { type: DataTypes.STRING, defaultValue: "Placement Coordinator" },
}, { tableName: "workspace_cohort_announcements", timestamps: true, underscored: true });

Cohort.hasMany(CohortAnnouncement, { foreignKey: "cohortId", as: "announcements" });
CohortAnnouncement.belongsTo(Cohort, { foreignKey: "cohortId", as: "cohort" });

export { Cohort, CohortAnnouncement };
