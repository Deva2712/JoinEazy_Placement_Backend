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
  userId:    { type: DataTypes.UUID, allowNull: true },
  rollNo:    { type: DataTypes.STRING, allowNull: false },
  name:      { type: DataTypes.STRING, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: true },
  branch:    { type: DataTypes.STRING, allowNull: true },
  school:    { type: DataTypes.STRING, allowNull: true },
  batchYear: { type: DataTypes.INTEGER, allowNull: true },
  cgpa:      { type: DataTypes.FLOAT, allowNull: true },
  backlogs:  { type: DataTypes.INTEGER, defaultValue: 0 },
  // Where the student currently stands this cycle.
  // "Placed" / "In Process" / "Not Placed" are the three values the coordinator's
  // StudentsTab filters and badges on. The rest are the skeleton's finer-grained
  // states, kept valid so existing rows and the drive pipeline still write them;
  // students-service maps them down to "In Process" on read.
  placementStatus: {
    type: DataTypes.ENUM(
      "Placed", "In Process", "Not Placed",
      "Eligible", "Not eligible", "Applied", "Interviewing", "Offered", "Opted out"
    ),
    defaultValue: "In Process",
  },
  // Denormalised snapshot of the accepted offer — the roster table shows these
  // columns constantly, and joining to offers for every row is wasteful.
  placedCompany: { type: DataTypes.STRING, allowNull: true },
  placedRole:    { type: DataTypes.STRING, allowNull: true },
  placedPackage: { type: DataTypes.FLOAT, allowNull: true },  // LPA
  sector:        { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_students",
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ["roll_no"] },
    { fields: ["batch_year"] }, { fields: ["branch"] }, { fields: ["placement_status"] },
  ],
});

/**
 * Resume / portfolio / skills the student maintains for applications.
 *
 * Renamed to camelCase attributes here (columns unchanged — `underscored: true`)
 * because the profile endpoint has to emit `linkedinUrl`/`githubUrl` verbatim to
 * ProfileTab, and half-mapping one model is worse than converting it.
 *
 * certifications/projects are JSON arrays rather than the two extra tables v1's
 * schema proposed: the UI only ever reads and writes them as whole embedded
 * lists on the profile, and this model already stores skills/documents the same
 * way. Promote them to tables if they ever need to be queried independently.
 */
const StudentPlacementProfile = sequelize.define("StudentPlacementProfile", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId:   { type: DataTypes.UUID, allowNull: false },
  resumeUrl:   { type: DataTypes.STRING, allowNull: true },
  projectUrl:  { type: DataTypes.STRING, allowNull: true },
  linkedinUrl: { type: DataTypes.STRING, allowNull: true },
  githubUrl:   { type: DataTypes.STRING, allowNull: true },
  skills:      { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // [{ name, issuer, date, url }]
  certifications: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // [{ title, description, url }]
  projects:    { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // [{ name, url, uploadedAt }] — certificates, marksheets.
  documents:   { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
}, {
  tableName: "placement_student_profiles",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["student_id"] }],
});

PlacementStudent.hasOne(StudentPlacementProfile, { foreignKey: "studentId", as: "profile", onDelete: "CASCADE" });
StudentPlacementProfile.belongsTo(PlacementStudent, { foreignKey: "studentId" });

export { PlacementStudent, StudentPlacementProfile };
