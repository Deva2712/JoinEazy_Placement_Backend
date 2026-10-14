// src/modules/interviews/interviews-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Application } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";

const InterviewSlot = sequelize.define("InterviewSlot", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  applicationId: { type: DataTypes.UUID, allowNull: true },
  jobId:         { type: DataTypes.UUID, allowNull: false },
  roundId:       { type: DataTypes.UUID, allowNull: true },
  studentId:     { type: DataTypes.UUID, allowNull: false },
  studentName:   { type: DataTypes.STRING, allowNull: true },
  // Denormalised: InterviewsTab renders `studentId` as a human-readable roll
  // number beside the name and searches on it, so reads emit this as
  // `studentId` while the column keeps the real FK.
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  round:         { type: DataTypes.INTEGER, allowNull: true },
  type:          { type: DataTypes.STRING, allowNull: true },
  scheduledAt:   { type: DataTypes.DATE, allowNull: false },
  durationMins:  { type: DataTypes.INTEGER, defaultValue: 60 },
  mode:          { type: DataTypes.ENUM("Online", "Offline"), defaultValue: "Online" },
  location:      { type: DataTypes.STRING, allowNull: true },
  link:          { type: DataTypes.STRING, allowNull: true },
  panelMembers:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  status:        { type: DataTypes.ENUM("Scheduled", "Completed", "Cancelled", "No show"), defaultValue: "Scheduled" },
  notes:         { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_interview_slots",
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ["job_id"] }, { fields: ["student_id"] },
    { fields: ["scheduled_at"] }, { fields: ["status"] },
  ],
});

Application.hasMany(InterviewSlot, { foreignKey: "applicationId", as: "interviews", onDelete: "CASCADE" });
InterviewSlot.belongsTo(Application, { foreignKey: "applicationId", as: "application" });
PlacementStudent.hasMany(InterviewSlot, { foreignKey: "studentId", sourceKey: "userId", as: "interviews", constraints: false });
InterviewSlot.belongsTo(PlacementStudent, { foreignKey: "studentId", targetKey: "userId", as: "student", constraints: false });

export { InterviewSlot };
