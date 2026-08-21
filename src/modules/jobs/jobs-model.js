// src/modules/jobs/jobs-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Company } from "../companies/companies-model.js";

/**
 * A placement drive — one role a company is hiring for this cycle.
 * The frontend calls these both "jobs" and "drives"; they are the same record.
 */
const Job = sequelize.define("Job", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id:  { type: DataTypes.UUID, allowNull: true },
  // Denormalised so a drive still renders if the company row is missing.
  company_name:{ type: DataTypes.STRING, allowNull: true },
  role:        { type: DataTypes.STRING, allowNull: false },
  // "Full Time" | "Internship" | "Internship + PPO"
  type:        { type: DataTypes.STRING, allowNull: true },
  location:    { type: DataTypes.STRING, allowNull: true },
  package:     { type: DataTypes.STRING, allowNull: true },   // free text, e.g. "₹40 LPA"
  stipend:     { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  requirements:{ type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  openings:    { type: DataTypes.INTEGER, allowNull: true },
  // Eligibility
  min_cgpa:    { type: DataTypes.FLOAT, allowNull: true },
  branches:    { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  batch_year:  { type: DataTypes.INTEGER, allowNull: true },
  posted_at:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deadline:    { type: DataTypes.DATE, allowNull: true },
  // Drive lifecycle — mirrors placementStage.js on the frontend.
  status: {
    type: DataTypes.ENUM("Applications open", "Assessment", "Interviews", "Offered", "Drive complete", "Closed", "Cancelled"),
    defaultValue: "Applications open",
  },
  created_by:  { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_jobs",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["company_id"] }, { fields: ["status"] }, { fields: ["deadline"] }],
});

/**
 * One selection round within a drive (Online Test → Technical → HR).
 * `sequence` drives ordering and the "advance to next round" action.
 */
const DriveRound = sequelize.define("DriveRound", {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  job_id:   { type: DataTypes.UUID, allowNull: false },
  name:     { type: DataTypes.STRING, allowNull: false },
  // "Aptitude Test" | "Technical" | "Group Discussion" | "Case Study" | "HR Interview"
  type:     { type: DataTypes.STRING, allowNull: true },
  sequence: { type: DataTypes.INTEGER, defaultValue: 1 },
  scheduled_at: { type: DataTypes.DATE, allowNull: true },
  status:   { type: DataTypes.ENUM("Pending", "In progress", "Complete"), defaultValue: "Pending" },
}, {
  tableName: "placement_drive_rounds",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["job_id"] }, { fields: ["job_id", "sequence"] }],
});

Company.hasMany(Job, { foreignKey: "company_id", as: "jobs" });
Job.belongsTo(Company, { foreignKey: "company_id", as: "company" });
Job.hasMany(DriveRound, { foreignKey: "job_id", as: "rounds", onDelete: "CASCADE" });
DriveRound.belongsTo(Job, { foreignKey: "job_id" });

export { Job, DriveRound };
