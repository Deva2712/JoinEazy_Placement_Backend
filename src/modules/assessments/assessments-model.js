// src/modules/assessments/assessments-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { PlacementStudent } from "../students/students-model.js";

/**
 * An online test attached to a drive (or run standalone for practice).
 * job_id is nullable so the same model backs both cases.
 */
const AssessmentTest = sequelize.define("AssessmentTest", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  job_id:    { type: DataTypes.UUID, allowNull: true },
  round_id:  { type: DataTypes.UUID, allowNull: true },
  title:     { type: DataTypes.STRING, allowNull: false },
  provider:  { type: DataTypes.STRING, allowNull: true },   // HackerRank, internal, …
  url:       { type: DataTypes.STRING, allowNull: true },
  total_marks:{ type: DataTypes.FLOAT, allowNull: true },
  cutoff:    { type: DataTypes.FLOAT, allowNull: true },
  instructions: { type: DataTypes.TEXT, allowNull: true },
  scheduled_at:{ type: DataTypes.DATE, allowNull: true },
  duration_mins:{ type: DataTypes.INTEGER, allowNull: true },
  status:    { type: DataTypes.ENUM("Draft", "Scheduled", "Completed", "Cancelled"), defaultValue: "Draft" },
}, {
  tableName: "placement_assessment_tests",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["job_id"] }, { fields: ["status"] }],
});

/** One student's score on one test. */
const AssessmentScore = sequelize.define("AssessmentScore", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  test_id:    { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  score:      { type: DataTypes.FLOAT, allowNull: true },
  percentile: { type: DataTypes.FLOAT, allowNull: true },
  // Derived from cutoff at record time, stored so a later cutoff change does
  // not silently rewrite history.
  result:     { type: DataTypes.ENUM("Cleared", "Not cleared", "Absent", "Pending"), defaultValue: "Pending" },
  attempted_at:{ type: DataTypes.DATE, allowNull: true },
  // Free-text note per result row — the results CSV carries an optional
  // `notes` column the coordinator uses for no-show/re-test remarks.
  notes:       { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_assessment_scores",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["test_id", "student_id"] }, { fields: ["student_id"] }],
});

AssessmentTest.hasMany(AssessmentScore, { foreignKey: "test_id", as: "scores", onDelete: "CASCADE" });
AssessmentScore.belongsTo(AssessmentTest, { foreignKey: "test_id", as: "test" });
PlacementStudent.hasMany(AssessmentScore, { foreignKey: "student_id", sourceKey: "userId", as: "assessmentScores", constraints: false });
AssessmentScore.belongsTo(PlacementStudent, { foreignKey: "student_id", targetKey: "userId", as: "student", constraints: false });

export { AssessmentTest, AssessmentScore };
