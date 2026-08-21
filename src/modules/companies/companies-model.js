// src/modules/companies/companies-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

/** A recruiting organisation. Shapes mirror MOCK_COMPANIES in the frontend. */
const Company = sequelize.define("Company", {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  sector:   { type: DataTypes.STRING, allowNull: true },
  // "Tier 1" | "Tier 2" | "Tier 3" — kept as STRING so the tier vocabulary can
  // change without a migration.
  tier:     { type: DataTypes.STRING, allowNull: true },
  profile:  { type: DataTypes.TEXT, allowNull: true },
  website:  { type: DataTypes.STRING, allowNull: true },
  // Which schools this company recruits from, e.g. ["Engineering", "Management"].
  schools:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // 0–100, drives the "engagement" column on the coordinator dashboard.
  engagement_score: { type: DataTypes.INTEGER, allowNull: true },
  status:   { type: DataTypes.ENUM("active", "inactive", "blacklisted"), defaultValue: "active" },
}, {
  tableName: "placement_companies",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["name"] }, { fields: ["sector"] }, { fields: ["status"] }],
});

/** Named recruiter at a company — the people the coordinator actually emails. */
const RecruiterContact = sequelize.define("RecruiterContact", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name:       { type: DataTypes.STRING, allowNull: false },
  email:      { type: DataTypes.STRING, allowNull: true },
  phone:      { type: DataTypes.STRING, allowNull: true },
  role:       { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_recruiter_contacts",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["company_id"] }],
});

/** One year of hiring outcomes, used for the company's history chart. */
const HiringHistory = sequelize.define("HiringHistory", {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id:      { type: DataTypes.UUID, allowNull: false },
  year:            { type: DataTypes.INTEGER, allowNull: false },
  students_placed: { type: DataTypes.INTEGER, defaultValue: 0 },
  avg_package:     { type: DataTypes.FLOAT, allowNull: true },   // LPA
}, {
  tableName: "placement_hiring_history",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["company_id", "year"] }],
});

Company.hasMany(RecruiterContact, { foreignKey: "company_id", as: "recruiterContacts", onDelete: "CASCADE" });
RecruiterContact.belongsTo(Company, { foreignKey: "company_id" });
Company.hasMany(HiringHistory, { foreignKey: "company_id", as: "hiringHistory", onDelete: "CASCADE" });
HiringHistory.belongsTo(Company, { foreignKey: "company_id" });

export { Company, RecruiterContact, HiringHistory };
