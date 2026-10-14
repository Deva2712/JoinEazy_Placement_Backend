// src/modules/mous/mous-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Company } from "../companies/companies-model.js";

const Mou = sequelize.define("Mou", {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId:      { type: DataTypes.UUID, allowNull: false },
  type:           { type: DataTypes.STRING, allowNull: true },
  startDate:      { type: DataTypes.DATEONLY, allowNull: true },
  endDate:        { type: DataTypes.DATEONLY, allowNull: true },
  rolesCovered:   { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  rolesLookingFor:{ type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  scope:          { type: DataTypes.TEXT, allowNull: true },
  documents:      { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // MOU_STATUSES in the frontend's placementCoordConstants.js is
  // ["Active","Renewal Pending","Expired","Draft"]; MoUForm additionally
  // preserves "Terminated" on edit, so all five are valid.
  status:         { type: DataTypes.ENUM("Draft", "Active", "Renewal Pending", "Expired", "Terminated"), defaultValue: "Draft" },
  notes:          { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "placement_mous",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["company_id"] }, { fields: ["status"] }],
});

const CampusVisit = sequelize.define("CampusVisit", {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mouId:   { type: DataTypes.UUID, allowNull: false },
  date:    { type: DataTypes.DATEONLY, allowNull: false },
  purpose: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "placement_campus_visits",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["mou_id"] }],
});

Company.hasMany(Mou, { foreignKey: "companyId", as: "mous", onDelete: "CASCADE" });
Mou.belongsTo(Company, { foreignKey: "companyId", as: "company" });
Mou.hasMany(CampusVisit, { foreignKey: "mouId", as: "campusVisits", onDelete: "CASCADE" });
CampusVisit.belongsTo(Mou, { foreignKey: "mouId" });

export { Mou, CampusVisit };
