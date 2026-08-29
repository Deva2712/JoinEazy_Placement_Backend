// src/modules/applications/applications-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Job, DriveRound } from "../jobs/jobs-model.js";
import { PlacementStudent } from "../students/students-model.js";

const Application = sequelize.define("Application", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId:       { type: DataTypes.UUID, allowNull: false },
  studentId:   { type: DataTypes.UUID, allowNull: false },
  studentName: { type: DataTypes.STRING, allowNull: true },
  studentRoll: { type: DataTypes.STRING, allowNull: true },
  // The first eight values are exactly APPLICATION_STATUSES from the frontend's
  // placementCoordConstants.js — the ATS board, funnel and transition graph all
  // branch on those literals, so they are the vocabulary of record. The rest are
  // the skeleton's original names, kept so existing rows and the drive-stage
  // flow ("Assessment") keep validating.
  status: {
    type: DataTypes.ENUM(
      "Applied", "Shortlisted", "Test Cleared", "Interview Scheduled",
      "Selected", "Rejected", "Offer Received", "Placed",
      "Assessment", "Assessment Cleared", "Interviewing", "Accepted", "Withdrawn"
    ),
    defaultValue: "Applied",
  },
  currentRound: { type: DataTypes.INTEGER, allowNull: true },
  resumeUrl:   { type: DataTypes.STRING, allowNull: true },
  appliedAt:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
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

const RoundResult = sequelize.define("RoundResult", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId:         { type: DataTypes.UUID, allowNull: false },
  roundId:       { type: DataTypes.UUID, allowNull: false },
  applicationId: { type: DataTypes.UUID, allowNull: true },
  studentId:     { type: DataTypes.UUID, allowNull: false },
  status:        { type: DataTypes.ENUM("Cleared", "Rejected", "Pending", "Absent"), defaultValue: "Pending" },
  score:         { type: DataTypes.FLOAT, allowNull: true },
  recordedAt:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  recordedBy:    { type: DataTypes.UUID, allowNull: true },
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

Job.hasMany(Application, { foreignKey: "jobId", as: "applications", onDelete: "CASCADE" });
Application.belongsTo(Job, { foreignKey: "jobId", as: "job" });
PlacementStudent.hasMany(Application, { foreignKey: "studentId", as: "applications", onDelete: "CASCADE" });
Application.belongsTo(PlacementStudent, { foreignKey: "studentId", as: "student" });
Application.hasMany(RoundResult, { foreignKey: "applicationId", as: "roundResults" });
RoundResult.belongsTo(Application, { foreignKey: "applicationId" });
DriveRound.hasMany(RoundResult, { foreignKey: "roundId", as: "results", onDelete: "CASCADE" });
RoundResult.belongsTo(DriveRound, { foreignKey: "roundId", as: "round" });

export { Application, RoundResult };
