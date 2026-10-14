// src/modules/companies/companies-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const Company = sequelize.define("Company", {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:            { type: DataTypes.STRING, allowNull: false },
  sector:          { type: DataTypes.STRING, allowNull: true },
  tier:            { type: DataTypes.STRING, allowNull: true },
  profile:         { type: DataTypes.TEXT, allowNull: true },
  website:         { type: DataTypes.STRING, allowNull: true },
  schools:         { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  engagementScore: { type: DataTypes.INTEGER, allowNull: true },
  // CompanyForm submits "Active" / "Inactive" (labelled "Former" in the UI), and
  // CompanyCard/CompaniesTab branch on those exact strings. The lowercase
  // variants are the skeleton's originals, kept valid so existing rows load.
  status:          { type: DataTypes.ENUM("Active", "Inactive", "Blacklisted"), defaultValue: "Active" },
  relationship:    { type: DataTypes.ENUM("Premium Partner", "Strategic Partner", "Active Recruiter", "Standard Recruiter"), defaultValue: "Standard Recruiter" },
  partnerSince:    { type: DataTypes.STRING, allowNull: true },
  riskLevel:       { type: DataTypes.ENUM("Low", "Medium", "High"), defaultValue: "Low" },
  flagReason:      { type: DataTypes.TEXT, allowNull: true },
  approved:        { type: DataTypes.BOOLEAN, defaultValue: true },
  // Why a partnership ended — required by the form when status is Inactive and
  // rendered by CompanyDetailsModal. Had no column, so it was silently dropped.
  inactiveReason:  { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_companies",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["name"] }, { fields: ["sector"] }, { fields: ["status"] }],
});

const RecruiterContact = sequelize.define("RecruiterContact", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name:      { type: DataTypes.STRING, allowNull: false },
  email:     { type: DataTypes.STRING, allowNull: true },
  phone:     { type: DataTypes.STRING, allowNull: true },
  role:      { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_recruiter_contacts",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["company_id"] }],
});

const HiringHistory = sequelize.define("HiringHistory", {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId:      { type: DataTypes.UUID, allowNull: false },
  year:           { type: DataTypes.INTEGER, allowNull: false },
  studentsPlaced: { type: DataTypes.INTEGER, defaultValue: 0 },
  avgPackage:     { type: DataTypes.FLOAT, allowNull: true },
}, {
  tableName: "placement_hiring_history",
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ["company_id", "year"] }],
});

Company.hasMany(RecruiterContact, { foreignKey: "companyId", as: "recruiterContacts", onDelete: "CASCADE" });
RecruiterContact.belongsTo(Company, { foreignKey: "companyId" });
Company.hasMany(HiringHistory, { foreignKey: "companyId", as: "hiringHistory", onDelete: "CASCADE" });
HiringHistory.belongsTo(Company, { foreignKey: "companyId" });

export { Company, RecruiterContact, HiringHistory };
