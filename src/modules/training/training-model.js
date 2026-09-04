// src/modules/training/training-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { PlacementStudent } from "../students/students-model.js";

/** A pre-placement training course (DSA, Aptitude, Soft Skills …). */
const TrainingCourse = sequelize.define("TrainingCourse", {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  eligible_branches: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  eligible_years:    { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  min_cgpa:    { type: DataTypes.FLOAT, allowNull: true },
  capacity:    { type: DataTypes.INTEGER, allowNull: true },
  start_date:  { type: DataTypes.DATEONLY, allowNull: true },
  end_date:    { type: DataTypes.DATEONLY, allowNull: true },
  default_instructor: { type: DataTypes.STRING, allowNull: true },
  // The ERP user id of the professor who runs this program. The prof
  // workspace ("my programs") filters on it, and every training write is
  // authorised against it — so it is an id, not the display name above.
  instructor_id: { type: DataTypes.UUID, allowNull: true },
  status:      { type: DataTypes.ENUM("Planned", "Running", "Completed", "Cancelled"), defaultValue: "Planned" },
}, {
  tableName: "placement_training_courses",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["status"] }, { fields: ["instructor_id"] }],
});

/** A student's enrolment in a training course. */
const CourseEnrollment = sequelize.define("CourseEnrollment", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id:  { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  status:     { type: DataTypes.ENUM("Enrolled", "Completed", "Dropped"), defaultValue: "Enrolled" },
  enrolled_at:{ type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "placement_course_enrollments",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["course_id", "student_id"] }, { fields: ["student_id"] }],
});

/** One class within a course. Attendance is recorded per session. */
const TrainingSession = sequelize.define("TrainingSession", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id:  { type: DataTypes.UUID, allowNull: false },
  title:      { type: DataTypes.STRING, allowNull: true },
  instructor: { type: DataTypes.STRING, allowNull: true },
  instructor_id: { type: DataTypes.UUID, allowNull: true },
  scheduled_at:{ type: DataTypes.DATE, allowNull: true },
  duration_mins:{ type: DataTypes.INTEGER, defaultValue: 60 },
  venue:      { type: DataTypes.STRING, allowNull: true },
  mode:       { type: DataTypes.ENUM("Online", "Offline"), defaultValue: "Offline" },
  status:     { type: DataTypes.ENUM("Scheduled", "Completed", "Cancelled"), defaultValue: "Scheduled" },
}, {
  tableName: "placement_training_sessions",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["course_id"] }, { fields: ["scheduled_at"] }, { fields: ["instructor_id"] }],
});

/** Per-student attendance for one training session. */
const TrainingAttendance = sequelize.define("TrainingAttendance", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_id: { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  status:     { type: DataTypes.ENUM("Present", "Absent", "Late", "Excused"), defaultValue: "Present" },
  marked_by:  { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_training_attendance",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["session_id", "student_id"] }],
});

/** An assessment inside a training program (a mock test, a coding round …). */
const TrainingTest = sequelize.define("TrainingTest", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  course_id:  { type: DataTypes.UUID, allowNull: false },
  title:      { type: DataTypes.STRING, allowNull: false },
  max_score:  { type: DataTypes.FLOAT, allowNull: false, defaultValue: 100 },
  held_on:    { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "placement_training_tests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["course_id"] }],
});

/** One student's score on one test. */
const TrainingScore = sequelize.define("TrainingScore", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  test_id:    { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  score:      { type: DataTypes.FLOAT, allowNull: true },
  notes:      { type: DataTypes.TEXT, allowNull: true },
  recorded_by:{ type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "placement_training_scores",
  timestamps: true,
  underscored: true,
  // One score per student per test — a re-submission updates, never duplicates.
  indexes: [{ unique: true, fields: ["test_id", "student_id"] }],
});

TrainingCourse.hasMany(CourseEnrollment, { foreignKey: "course_id", as: "enrollments", onDelete: "CASCADE" });
CourseEnrollment.belongsTo(TrainingCourse, { foreignKey: "course_id", as: "course" });
PlacementStudent.hasMany(CourseEnrollment, { foreignKey: "student_id", as: "enrollments", onDelete: "CASCADE" });
CourseEnrollment.belongsTo(PlacementStudent, { foreignKey: "student_id", as: "student" });
TrainingCourse.hasMany(TrainingSession, { foreignKey: "course_id", as: "sessions", onDelete: "CASCADE" });
TrainingSession.belongsTo(TrainingCourse, { foreignKey: "course_id" });
TrainingSession.hasMany(TrainingAttendance, { foreignKey: "session_id", as: "attendance", onDelete: "CASCADE" });
TrainingAttendance.belongsTo(TrainingSession, { foreignKey: "session_id" });

TrainingCourse.hasMany(TrainingTest, { foreignKey: "course_id", as: "tests", onDelete: "CASCADE" });
TrainingTest.belongsTo(TrainingCourse, { foreignKey: "course_id" });
TrainingTest.hasMany(TrainingScore, { foreignKey: "test_id", as: "scores", onDelete: "CASCADE" });
TrainingScore.belongsTo(TrainingTest, { foreignKey: "test_id" });

export {
  TrainingCourse, CourseEnrollment, TrainingSession,
  TrainingAttendance, TrainingTest, TrainingScore,
};
