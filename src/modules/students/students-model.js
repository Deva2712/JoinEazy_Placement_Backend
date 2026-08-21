// src/modules/students/students-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/**
 * Placement roster row. This service does not own student identity — accounts
 * live in the main ERP — it owns the placement-facing view of a student
 * (eligibility, current status, where they landed).
 */
const PlacementStudent = sequelize.define("PlacementStudent", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // The main ERP's user id, when the student has an account. Nullable so a
  // roster imported from a spreadsheet is still usable before accounts exist.
  user_id:   { type: DataTypes.UUID, allowNull: true },
  roll_no:   { type: DataTypes.STRING, allowNull: false },
  name:      { type: DataTypes.STRING, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: true },
  branch:    { type: DataTypes.STRING, allowNull: true },
  school:    { type: DataTypes.STRING, allowNull: true },
  batch_year:{ type: DataTypes.INTEGER, allowNull: true },
  cgpa:      { type: DataTypes.FLOAT, allowNull: true },
  backlogs:  { type: DataTypes.INTEGER, defaultValue: 0 },
  // Where the student currently stands this cycle.
  placement_status: {
    type: DataTypes.ENUM("Eligible", "Not eligible", "Applied", "Interviewing", "Offered", "Placed", "Opted out"),
    defaultValue: "Eligible",
  },
  // Denormalised snapshot of the accepted offer — the roster table shows these
  // columns constantly, and joining to offers for every row is wasteful.
  placed_company: { type: DataTypes.STRING, allowNull: true },
  placed_role:    { type: DataTypes.STRING, allowNull: true },
  placed_package: { type: DataTypes.FLOAT, allowNull: true },  // LPA
  sector:         { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_students",
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ["roll_no"] },
    { fields: ["batch_year"] }, { fields: ["branch"] }, { fields: ["placement_status"] },
  ],
});

/** Resume / portfolio the student maintains for applications. */
const StudentPlacementProfile = sequelize.define("StudentPlacementProfile", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  resume_url: { type: DataTypes.STRING, allowNull: true },
  project_url:{ type: DataTypes.STRING, allowNull: true },
  linkedin:   { type: DataTypes.STRING, allowNull: true },
  github:     { type: DataTypes.STRING, allowNull: true },
  skills:     { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // [{ name, url, uploadedAt }] — certificates, marksheets.
  documents:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
}, {
  tableName: "placement_student_profiles",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["student_id"] }],
});

PlacementStudent.hasOne(StudentPlacementProfile, { foreignKey: "student_id", as: "profile", onDelete: "CASCADE" });
StudentPlacementProfile.belongsTo(PlacementStudent, { foreignKey: "student_id" });

export { PlacementStudent, StudentPlacementProfile };
