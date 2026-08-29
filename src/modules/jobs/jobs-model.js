// src/modules/jobs/jobs-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Company } from "../companies/companies-model.js";

/**
 * A drive (the coordinator's word) / job opening (the student's word).
 *
 * The block of columns below `batchYear` were specified in the v1 master
 * context's `drives` table but never made it into the skeleton. JobOpeningModal
 * submits every one of them on create/edit, so without them Sequelize silently
 * dropped the values and the Drives tab lost the JD links, eligibility limits
 * and round summary on the next read.
 */
const Job = sequelize.define("Job", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId:     { type: DataTypes.UUID, allowNull: true },
  companyName:   { type: DataTypes.STRING, allowNull: true },
  role:          { type: DataTypes.STRING, allowNull: false },
  type:          { type: DataTypes.STRING, allowNull: true },
  location:      { type: DataTypes.STRING, allowNull: true },
  package:       { type: DataTypes.STRING, allowNull: true },
  stipend:       { type: DataTypes.STRING, allowNull: true },
  // Internship length, e.g. "6 months". Only set when type is an internship.
  duration:      { type: DataTypes.STRING, allowNull: true },
  description:   { type: DataTypes.TEXT, allowNull: true },
  requirements:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  openings:      { type: DataTypes.INTEGER, allowNull: true },
  minCgpa:       { type: DataTypes.FLOAT, allowNull: true },
  branches:      { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  batchYear:     { type: DataTypes.INTEGER, allowNull: true },

  // ─── Eligibility limits (v1 `drives`, absent from the skeleton) ────────────
  maxBacklogs:    { type: DataTypes.INTEGER, allowNull: true },
  graduationYear: { type: DataTypes.INTEGER, allowNull: true },

  // ─── Job-description sources. The modal persists whichever the coordinator
  // chose and nulls the other, so a switched-over drive keeps no stale link.
  jdUrl:              { type: DataTypes.STRING, allowNull: true },
  jdFileUrl:          { type: DataTypes.STRING, allowNull: true },
  jdFileName:         { type: DataTypes.STRING, allowNull: true },
  applicationFormUrl: { type: DataTypes.STRING, allowNull: true },
  additionalInfo:     { type: DataTypes.TEXT, allowNull: true },
  // Free-text summary of the selection path ("3 (OA → Technical → HR)").
  // Derived by the modal from selectionRounds; stored because older views and
  // the student-facing card still render this string directly.
  rounds:             { type: DataTypes.STRING, allowNull: true },

  postedAt:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deadline:      { type: DataTypes.DATE, allowNull: true },
  archived:      { type: DataTypes.BOOLEAN, defaultValue: false },
  status: {
    type: DataTypes.ENUM("Applications open", "Assessment", "Interviews", "Offered", "Drive complete", "Closed", "Cancelled"),
    defaultValue: "Applications open",
  },
  createdBy:     { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_jobs",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["company_id"] }, { fields: ["status"] }, { fields: ["deadline"] }],
});

/**
 * One stage of a drive's selection path. `format`/`category`/`config` carry the
 * structured round definition JobOpeningModal builds (selectionRounds[]); the
 * skeleton only had name/type/sequence, which lost the rest on save.
 */
const DriveRound = sequelize.define("DriveRound", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId:       { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  type:        { type: DataTypes.STRING, allowNull: true },
  sequence:    { type: DataTypes.INTEGER, defaultValue: 1 },
  format:      { type: DataTypes.STRING, allowNull: true },   // test-link | scheduled | …
  category:    { type: DataTypes.STRING, allowNull: true },   // screening | interview | …
  config:      { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  scheduledAt: { type: DataTypes.DATE, allowNull: true },
  status:      { type: DataTypes.ENUM("Pending", "In progress", "Complete"), defaultValue: "Pending" },
}, {
  tableName: "placement_drive_rounds",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["job_id"] }, { fields: ["job_id", "sequence"] }],
});

Company.hasMany(Job, { foreignKey: "companyId", as: "jobs" });
// Aliased "companyRef", not "company": the frontend's drive object uses
// `company` for the plain company-name string, and an association sharing that
// key would overwrite it with an object on every read.
Job.belongsTo(Company, { foreignKey: "companyId", as: "companyRef" });
// Aliased "selectionRounds" to match the frontend's field name and to avoid
// colliding with the `rounds` summary-string column above — Sequelize rejects a
// model where an attribute and an association share a name.
Job.hasMany(DriveRound, { foreignKey: "jobId", as: "selectionRounds", onDelete: "CASCADE" });
DriveRound.belongsTo(Job, { foreignKey: "jobId" });

export { Job, DriveRound };
