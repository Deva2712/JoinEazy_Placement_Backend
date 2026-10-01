// src/modules/cohort-members/cohort-members-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortMember = sequelize.define("CohortMember", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:  { type: DataTypes.STRING, allowNull: false },   // STRING not UUID — frontend sends "1", "2" etc.
  user_id:    { type: DataTypes.UUID, allowNull: false },
  name:       { type: DataTypes.STRING, allowNull: false },
  email:      { type: DataTypes.STRING, allowNull: true },
  avatar:     { type: DataTypes.STRING, allowNull: true },
  role:       { type: DataTypes.ENUM("student", "professor", "admin"), defaultValue: "student" },
  department: { type: DataTypes.STRING, allowNull: true },
  joined_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "cohort_members",
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ["cohort_id", "user_id"] },
    { fields: ["cohort_id"] },
  ],
});

export default CohortMember;