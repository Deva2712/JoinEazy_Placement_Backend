// src/modules/interviews/interviews-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Application } from "../applications/applications-model.js";

/** A scheduled interview slot for one application/round. */
const InterviewSlot = sequelize.define("InterviewSlot", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  application_id:{ type: DataTypes.UUID, allowNull: true },
  job_id:        { type: DataTypes.UUID, allowNull: false },
  round_id:      { type: DataTypes.UUID, allowNull: true },
  student_id:    { type: DataTypes.UUID, allowNull: false },
  student_name:  { type: DataTypes.STRING, allowNull: true },
  round:         { type: DataTypes.INTEGER, allowNull: true },
  // "Technical" | "HR" | "Group Discussion" | "Case Study"
  type:          { type: DataTypes.STRING, allowNull: true },
  scheduled_at:  { type: DataTypes.DATE, allowNull: false },
  duration_mins: { type: DataTypes.INTEGER, defaultValue: 60 },
  mode:          { type: DataTypes.ENUM("Online", "Offline"), defaultValue: "Online" },
  location:      { type: DataTypes.STRING, allowNull: true },  // when Offline
  link:          { type: DataTypes.STRING, allowNull: true },  // when Online
  panel_members: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
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

Application.hasMany(InterviewSlot, { foreignKey: "application_id", as: "interviews", onDelete: "CASCADE" });
InterviewSlot.belongsTo(Application, { foreignKey: "application_id", as: "application" });

export { InterviewSlot };
