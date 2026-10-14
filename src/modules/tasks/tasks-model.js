// src/modules/tasks/tasks-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { PlacementStudent } from "../students/students-model.js";

/** Coordinator to-do item — the placement cell's own work tracker. */
const PlacementTask = sequelize.define("PlacementTask", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:      { type: DataTypes.STRING, allowNull: false },
  description:{ type: DataTypes.TEXT, allowNull: true },
  // What the task hangs off, when it hangs off anything.
  related_type:{ type: DataTypes.STRING, allowNull: true },   // "company" | "job" | "mou" | "student"
  related_id: { type: DataTypes.UUID, allowNull: true },
  assignedTo: { type: DataTypes.UUID, allowNull: true, field: "assigned_to" },
  due_date:   { type: DataTypes.DATEONLY, allowNull: true },
  priority:   { type: DataTypes.ENUM("Low", "Normal", "High", "Urgent"), defaultValue: "Normal" },
  status:     { type: DataTypes.ENUM("Open", "In progress", "Done", "Cancelled"), defaultValue: "Open" },
  createdBy:  { type: DataTypes.UUID, allowNull: true, field: "created_by" },
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
  studentId:   { type: DataTypes.UUID, allowNull: false },
  studentName: { type: DataTypes.STRING, allowNull: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  role:        { type: DataTypes.STRING, allowNull: true },
  ctcValue:    { type: DataTypes.FLOAT, allowNull: true, field: "ctc_value" },
  location:    { type: DataTypes.STRING, allowNull: true },
  sector:      { type: DataTypes.STRING, allowNull: true },
  offerDate:   { type: DataTypes.DATEONLY, allowNull: true },
  proofUrl:    { type: DataTypes.STRING, allowNull: true },
  status:      { type: DataTypes.ENUM("Pending verification", "Verified", "Rejected"), defaultValue: "Pending verification" },
  verifiedBy:  { type: DataTypes.UUID, allowNull: true },

  // ─── Fields OffCampusRecordModal actually submits ──────────────────────────
  // The skeleton stored only company/role/ctc/location, so everything else the
  // modal collected was dropped on save and came back blank on edit.
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  studentBranch: { type: DataTypes.STRING, allowNull: true },
  // "Internship" | "Full-time (off-campus)"
  type:        { type: DataTypes.STRING, allowNull: true },
  // "Self-sourced" | "Referral"
  source:      { type: DataTypes.STRING, allowNull: true },
  // Stipend or CTC as typed ("₹40,000/mo", "₹18 LPA"); `ctc` keeps the numeric.
  ctc:         { type: DataTypes.STRING, allowNull: true },
  appliedAt:   { type: DataTypes.DATE, allowNull: true },
  startDate:   { type: DataTypes.DATEONLY, allowNull: true },
  endDate:     { type: DataTypes.DATEONLY, allowNull: true },
  letterUrl:   { type: DataTypes.STRING, allowNull: true },
  notes:       { type: DataTypes.TEXT, allowNull: true },
  // Mirrors `status`; the modal binds a checkbox to this boolean.
  verified:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "placement_off_campus_records",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }, { fields: ["status"] }],
});

PlacementStudent.hasMany(OffCampusRecord, { foreignKey: "studentId", sourceKey: "userId", as: "offCampusRecords", constraints: false });
OffCampusRecord.belongsTo(PlacementStudent, { foreignKey: "studentId", targetKey: "userId", as: "student", constraints: false });

export { PlacementTask, OffCampusRecord };
