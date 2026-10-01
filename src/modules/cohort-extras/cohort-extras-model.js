import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const CohortDetailSection = sequelize.define("CohortDetailSection", {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:          { type: DataTypes.STRING, allowNull: false },
  title:              { type: DataTypes.STRING, allowNull: false },
  subsec_description: { type: DataTypes.TEXT, allowNull: true },
  order:              { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: "cohort_detail_sections",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["cohort_id"] }],
});

const CohortGroup = sequelize.define("CohortGroup", {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:         { type: DataTypes.STRING, allowNull: false },
  group_name:        { type: DataTypes.STRING, allowNull: false },
  group_description: { type: DataTypes.TEXT, allowNull: true },
  project_name:      { type: DataTypes.STRING, allowNull: true },
  max_members:       { type: DataTypes.INTEGER, defaultValue: 4 },
  invite_token:      { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "cohort_groups",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["cohort_id"] }],
});

const CohortGroupMember = sequelize.define("CohortGroupMember", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  group_id:  { type: DataTypes.UUID, allowNull: false },
  user_id:   { type: DataTypes.STRING, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: true },
  role:      { type: DataTypes.ENUM("leader", "member"), defaultValue: "member" },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "cohort_group_members",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["group_id", "user_id"] }],
});

const CohortParticipant = sequelize.define("CohortParticipant", {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cohort_id:    { type: DataTypes.STRING, allowNull: false },
  user_id:      { type: DataTypes.STRING, allowNull: true },
  email:        { type: DataTypes.STRING, allowNull: false },
  display_name: { type: DataTypes.STRING, allowNull: true },
  username:     { type: DataTypes.STRING, allowNull: true },
  roll_number:  { type: DataTypes.STRING, allowNull: true },
  profile_pic:  { type: DataTypes.STRING, allowNull: true },
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "cohort_participants",
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ["cohort_id"] },
    { unique: true, fields: ["cohort_id", "email"] },
  ],
});

CohortGroup.hasMany(CohortGroupMember, { foreignKey: "group_id", as: "CohortGroupMembers", onDelete: "CASCADE" });
CohortGroupMember.belongsTo(CohortGroup, { foreignKey: "group_id", as: "group" });

export { CohortDetailSection, CohortGroup, CohortGroupMember, CohortParticipant };
