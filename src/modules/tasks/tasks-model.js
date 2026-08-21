// src/modules/tasks/tasks-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/** Coordinator to-do item — the placement cell's own work tracker. */
const PlacementTask = sequelize.define("PlacementTask", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:      { type: DataTypes.STRING, allowNull: false },
  description:{ type: DataTypes.TEXT, allowNull: true },
  // What the task hangs off, when it hangs off anything.
  related_type:{ type: DataTypes.STRING, allowNull: true },   // "company" | "job" | "mou" | "student"
  related_id: { type: DataTypes.UUID, allowNull: true },
  assigned_to:{ type: DataTypes.UUID, allowNull: true },
  due_date:   { type: DataTypes.DATEONLY, allowNull: true },
  priority:   { type: DataTypes.ENUM("Low", "Normal", "High", "Urgent"), defaultValue: "Normal" },
  status:     { type: DataTypes.ENUM("Open", "In progress", "Done", "Cancelled"), defaultValue: "Open" },
  created_by: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_tasks",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["assigned_to"] }, { fields: ["status"] }, { fields: ["due_date"] }],
});

/**
 * A placement the student found themselves. Tracked separately because these
 * never went through a drive but still count toward placement statistics.
 */
const OffCampusRecord = sequelize.define("OffCampusRecord", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id:  { type: DataTypes.UUID, allowNull: false },
  student_name:{ type: DataTypes.STRING, allowNull: true },
  company_name:{ type: DataTypes.STRING, allowNull: false },
  role:        { type: DataTypes.STRING, allowNull: true },
  ctc:         { type: DataTypes.FLOAT, allowNull: true },
  location:    { type: DataTypes.STRING, allowNull: true },
  sector:      { type: DataTypes.STRING, allowNull: true },
  offer_date:  { type: DataTypes.DATEONLY, allowNull: true },
  proof_url:   { type: DataTypes.STRING, allowNull: true },
  // The cell verifies the offer letter before it counts in reporting.
  status:      { type: DataTypes.ENUM("Pending verification", "Verified", "Rejected"), defaultValue: "Pending verification" },
  verified_by: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_off_campus_records",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }, { fields: ["status"] }],
});

export { PlacementTask, OffCampusRecord };
