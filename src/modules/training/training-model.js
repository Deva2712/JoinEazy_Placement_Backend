// src/modules/training/training-model.js
//
// Pre-placement training: programmes (courses), the sessions that make them up,
// who is enrolled, and who turned up.
//
// Converted to camelCase attributes (columns stay snake_case via
// `underscored: true`) and widened to carry the fields the coordinator's
// TrainingTab actually submits — the skeleton's sessions had no category, mode
// link, capacity or eligibility, so CourseModal/SessionModal saved them and got
// nothing back.
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { PlacementStudent } from "../students/students-model.js";

/**
 * Someone who teaches training sessions. This service does not own staff
 * accounts — professors live in the main ERP — but the coordinator picks an
 * instructor from a list when scheduling, and no other table here can supply
 * one. Kept deliberately thin: a name/email directory, not an identity record.
 */
const TrainingInstructor = sequelize.define("TrainingInstructor", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:       { type: DataTypes.STRING, allowNull: false },
  email:      { type: DataTypes.STRING, allowNull: true },
  role:       { type: DataTypes.STRING, allowNull: true, defaultValue: "professor" },
  department: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_training_instructors",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["email"] }],
});

/** A pre-placement training course / programme (DSA, Aptitude, Soft Skills …). */
const TrainingCourse = sequelize.define("TrainingCourse", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:             { type: DataTypes.STRING, allowNull: false },
  description:      { type: DataTypes.TEXT, allowNull: true },
  eligibleBranches: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  eligibleYears:    { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  minCgpa:          { type: DataTypes.FLOAT, allowNull: true },
  capacity:         { type: DataTypes.INTEGER, allowNull: true },
  startDate:        { type: DataTypes.DATEONLY, allowNull: true },
  endDate:          { type: DataTypes.DATEONLY, allowNull: true },
  // Instructor ids assigned to the programme. A JSON array rather than a join
  // table because the UI edits it as one list on the course form and never
  // queries "which courses does this instructor teach" from the other side.
  instructorIds:    { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // [{ id, name, org }] — externals with no directory entry.
  guestInstructors: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  defaultInstructor:{ type: DataTypes.STRING, allowNull: true },
  status:           { type: DataTypes.ENUM("Planned", "Running", "Completed", "Cancelled"), defaultValue: "Planned" },
}, {
  tableName: "placement_training_courses",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["status"] }],
});

/** A student's enrolment in a training course. */
const CourseEnrollment = sequelize.define("CourseEnrollment", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  courseId:   { type: DataTypes.UUID, allowNull: false },
  studentId:  { type: DataTypes.UUID, allowNull: false },
  status:     { type: DataTypes.ENUM("Enrolled", "Completed", "Dropped"), defaultValue: "Enrolled" },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "placement_course_enrollments",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["course_id", "student_id"] }, { fields: ["student_id"] }],
});

/**
 * One class. `courseId` is nullable: the coordinator schedules plenty of
 * one-off sessions (a guest talk, a mock-interview drive) that belong to no
 * programme, and the tab lists those beside course sessions.
 */
const TrainingSession = sequelize.define("TrainingSession", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  courseId:         { type: DataTypes.UUID, allowNull: true },
  type:             { type: DataTypes.STRING, allowNull: true },   // "Soft Skills", "Technical" …
  category:         { type: DataTypes.STRING, allowNull: true },   // free-form programme grouping
  title:            { type: DataTypes.STRING, allowNull: true },
  instructor:       { type: DataTypes.STRING, allowNull: true },
  instructorId:     { type: DataTypes.STRING, allowNull: true },
  // Named `date` to match what the UI sends; the column is scheduled_at.
  date:             { type: DataTypes.DATE, allowNull: true, field: "scheduled_at" },
  endDate:          { type: DataTypes.DATE, allowNull: true },
  durationMins:     { type: DataTypes.INTEGER, defaultValue: 60 },
  capacity:         { type: DataTypes.INTEGER, allowNull: true },
  venue:            { type: DataTypes.STRING, allowNull: true },
  link:             { type: DataTypes.STRING, allowNull: true },
  mode:             { type: DataTypes.ENUM("Online", "Offline"), defaultValue: "Offline" },
  eligibleBranches: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  minCgpa:          { type: DataTypes.FLOAT, allowNull: true },
  prerequisites:    { type: DataTypes.TEXT, allowNull: true },
  status:           { type: DataTypes.ENUM("Scheduled", "Completed", "Cancelled"), defaultValue: "Scheduled" },
}, {
  tableName: "placement_training_sessions",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["course_id"] }, { fields: ["scheduled_at"] }],
});

/**
 * Per-student attendance for one session.
 *
 * `registered` and `present` are separate booleans rather than one status enum
 * because they answer different questions and the UI shows both: a student
 * registers first (or is added by the coordinator), and `present` stays null
 * until someone actually marks the register. Collapsing them would lose the
 * "signed up but not yet marked" state the attendance table renders.
 */
const TrainingAttendance = sequelize.define("TrainingAttendance", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  sessionId:  { type: DataTypes.UUID, allowNull: false },
  studentId:  { type: DataTypes.UUID, allowNull: false },
  // Denormalised so the attendance table can render a roll number without a
  // roster join per row; it is also the identity the UI sends back.
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  registered: { type: DataTypes.BOOLEAN, defaultValue: true },
  present:    { type: DataTypes.BOOLEAN, allowNull: true },
  notes:      { type: DataTypes.TEXT, allowNull: true },
  markedBy:   { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_training_attendance",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["session_id", "student_id"] }],
});

/**
 * A training test (Aptitude Test 1, DSA Foundations …) and its scores.
 *
 * Deliberately separate from assessments-model.js's AssessmentTest/
 * AssessmentScore, which back a DRIVE's assessment round: those are pass/fail
 * against a company cutoff and hang off a jobId, these are numeric scores out
 * of maxScore grouped by training category. Folding both into one table would
 * leave half its columns null for either use and force every query to branch on
 * whether jobId is set.
 */
const TrainingTest = sequelize.define("TrainingTest", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  courseId:    { type: DataTypes.UUID, allowNull: true },
  category:    { type: DataTypes.STRING, allowNull: true },
  // Nth test within its category — the UI labels tests "Aptitude Test 2".
  testNumber:  { type: DataTypes.INTEGER, allowNull: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  testLink:    { type: DataTypes.STRING, allowNull: true },
  maxScore:    { type: DataTypes.FLOAT, allowNull: true },
  date:        { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "placement_training_tests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["category"] }],
});

const TrainingScore = sequelize.define("TrainingScore", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  testId:        { type: DataTypes.UUID, allowNull: false },
  studentId:     { type: DataTypes.UUID, allowNull: false },
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  score:         { type: DataTypes.FLOAT, allowNull: true },
  notes:         { type: DataTypes.TEXT, allowNull: true },
  recordedAt:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "placement_training_scores",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["test_id", "student_id"] }, { fields: ["student_id"] }],
});

TrainingTest.hasMany(TrainingScore, { foreignKey: "testId", as: "scores", onDelete: "CASCADE" });
TrainingScore.belongsTo(TrainingTest, { foreignKey: "testId", as: "test" });

TrainingCourse.hasMany(CourseEnrollment, { foreignKey: "courseId", as: "enrollments", onDelete: "CASCADE" });
CourseEnrollment.belongsTo(TrainingCourse, { foreignKey: "courseId", as: "course" });
PlacementStudent.hasMany(CourseEnrollment, { foreignKey: "studentId", as: "enrollments", onDelete: "CASCADE" });
CourseEnrollment.belongsTo(PlacementStudent, { foreignKey: "studentId", as: "student" });
TrainingCourse.hasMany(TrainingSession, { foreignKey: "courseId", as: "sessions", onDelete: "CASCADE" });
TrainingSession.belongsTo(TrainingCourse, { foreignKey: "courseId" });
TrainingSession.hasMany(TrainingAttendance, { foreignKey: "sessionId", as: "attendance", onDelete: "CASCADE" });
TrainingAttendance.belongsTo(TrainingSession, { foreignKey: "sessionId" });

export {
  TrainingInstructor, TrainingCourse, CourseEnrollment,
  TrainingSession, TrainingAttendance, TrainingTest, TrainingScore,
};
