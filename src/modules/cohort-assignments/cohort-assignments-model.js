// src/modules/cohort-assignments/cohort-assignments-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortAssignment = sequelize.define("CohortAssignment", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:   { type: DataTypes.STRING, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  deadline:    { type: DataTypes.DATE, allowNull: true },
  marks:       { type: DataTypes.STRING, allowNull: true, defaultValue: "10" },
  type:        { type: DataTypes.ENUM("individual", "group"), defaultValue: "individual" },
  created_by:  { type: DataTypes.UUID, allowNull: true },
  submission_link: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "cohort_assignments",
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ["cohort_id"] },
    { fields: ["cohort_id", "deadline"] },
  ],
});

const AssignmentSubmission = sequelize.define("AssignmentSubmission", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assignment_id: { type: DataTypes.UUID, allowNull: false, references: { model: "cohort_assignments", key: "id" }, onDelete: "CASCADE" },
  student_id:    { type: DataTypes.UUID, allowNull: false },
  student_name:  { type: DataTypes.STRING, allowNull: true },
  link:          { type: DataTypes.STRING, allowNull: true },
  note:          { type: DataTypes.TEXT, allowNull: true },
  grade:         { type: DataTypes.STRING, allowNull: true },
  submitted_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "assignment_submissions",
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ["assignment_id"] },
    { unique: true, fields: ["assignment_id", "student_id"] },
  ],
});

CohortAssignment.hasMany(AssignmentSubmission, { foreignKey: "assignment_id", as: "submissions", onDelete: "CASCADE" });
AssignmentSubmission.belongsTo(CohortAssignment, { foreignKey: "assignment_id" });

export { CohortAssignment, AssignmentSubmission };