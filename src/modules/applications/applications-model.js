// src/modules/applications/applications-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Job, DriveRound } from "../jobs/jobs-model.js";
import { PlacementStudent } from "../students/students-model.js";

/** A student's application to one drive. Unique per (job, student). */
const Application = sequelize.define("Application", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  job_id:      { type: DataTypes.UUID, allowNull: false },
  student_id:  { type: DataTypes.UUID, allowNull: false },
  // Denormalised for list views that would otherwise join on every row.
  student_name:{ type: DataTypes.STRING, allowNull: true },
  student_roll:{ type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM(
      "Applied", "Assessment", "Assessment Cleared", "Shortlisted",
      "Interview Scheduled", "Interviewing", "Selected",
      "Offer Received", "Accepted", "Rejected", "Withdrawn"
    ),
    defaultValue: "Applied",
  },
  // How far the student has progressed; null before the first round.
  current_round: { type: DataTypes.INTEGER, allowNull: true },
  resume_url:  { type: DataTypes.STRING, allowNull: true },
  applied_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  notes:       { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_applications",
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ["job_id", "student_id"] },
    { fields: ["student_id"] }, { fields: ["status"] },
  ],
});

/** Outcome of one student in one round — the per-round scorecard. */
const RoundResult = sequelize.define("RoundResult", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  job_id:        { type: DataTypes.UUID, allowNull: false },
  round_id:      { type: DataTypes.UUID, allowNull: false },
  application_id:{ type: DataTypes.UUID, allowNull: true },
  student_id:    { type: DataTypes.UUID, allowNull: false },
  status:        { type: DataTypes.ENUM("Cleared", "Rejected", "Pending", "Absent"), defaultValue: "Pending" },
  score:         { type: DataTypes.FLOAT, allowNull: true },
  recorded_at:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  recorded_by:   { type: DataTypes.UUID, allowNull: true },
  notes:         { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_round_results",
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ["round_id", "student_id"] },
    { fields: ["job_id"] }, { fields: ["application_id"] },
  ],
});

Job.hasMany(Application, { foreignKey: "job_id", as: "applications", onDelete: "CASCADE" });
Application.belongsTo(Job, { foreignKey: "job_id", as: "job" });
PlacementStudent.hasMany(Application, { foreignKey: "student_id", as: "applications", onDelete: "CASCADE" });
Application.belongsTo(PlacementStudent, { foreignKey: "student_id", as: "student" });
Application.hasMany(RoundResult, { foreignKey: "application_id", as: "roundResults" });
RoundResult.belongsTo(Application, { foreignKey: "application_id" });
DriveRound.hasMany(RoundResult, { foreignKey: "round_id", as: "results", onDelete: "CASCADE" });
RoundResult.belongsTo(DriveRound, { foreignKey: "round_id", as: "round" });

export { Application, RoundResult };
