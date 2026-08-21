// src/modules/mous/mous-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Company } from "../companies/companies-model.js";

/** Memorandum of Understanding between the institution and a company. */
const Mou = sequelize.define("Mou", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  // "Internship" | "Placement" | "Both"
  type:       { type: DataTypes.STRING, allowNull: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  end_date:   { type: DataTypes.DATEONLY, allowNull: true },
  // Roles the agreement covers vs roles they are actively hiring for.
  roles_covered:      { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  roles_looking_for:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // [{ name, url }] — signed PDFs. Files live in object storage, not the DB.
  documents:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  status:     { type: DataTypes.ENUM("Draft", "Active", "Expired", "Terminated"), defaultValue: "Draft" },
  notes:      { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_mous",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["company_id"] }, { fields: ["status"] }],
});

/** A dated campus visit under an MOU (pre-placement talk, assessment, …). */
const CampusVisit = sequelize.define("CampusVisit", {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mou_id:  { type: DataTypes.UUID, allowNull: false },
  date:    { type: DataTypes.DATEONLY, allowNull: false },
  purpose: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_campus_visits",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["mou_id"] }],
});

Company.hasMany(Mou, { foreignKey: "company_id", as: "mous", onDelete: "CASCADE" });
Mou.belongsTo(Company, { foreignKey: "company_id", as: "company" });
Mou.hasMany(CampusVisit, { foreignKey: "mou_id", as: "campusVisits", onDelete: "CASCADE" });
CampusVisit.belongsTo(Mou, { foreignKey: "mou_id" });

export { Mou, CampusVisit };
