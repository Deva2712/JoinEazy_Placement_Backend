// src/modules/offers/offers-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Application } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";

/** A job offer extended to a student. Accepting one is what marks them Placed. */
const Offer = sequelize.define("Offer", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  application_id:{ type: DataTypes.UUID, allowNull: true },
  job_id:        { type: DataTypes.UUID, allowNull: true },
  student_id:    { type: DataTypes.UUID, allowNull: false },
  student_name:  { type: DataTypes.STRING, allowNull: true },
  student_branch:{ type: DataTypes.STRING, allowNull: true },
  company_id:    { type: DataTypes.UUID, allowNull: true },
  company_name:  { type: DataTypes.STRING, allowNull: true },
  role:          { type: DataTypes.STRING, allowNull: true },
  ctc:           { type: DataTypes.FLOAT, allowNull: true },   // LPA, numeric for aggregation
  ctc_display:   { type: DataTypes.STRING, allowNull: true },  // e.g. "30 LPA"
  joining_date:  { type: DataTypes.DATEONLY, allowNull: true },
  location:      { type: DataTypes.STRING, allowNull: true },
  sector:        { type: DataTypes.STRING, allowNull: true },
  // Pre-placement offer converted from an internship.
  ppo:           { type: DataTypes.BOOLEAN, defaultValue: false },
  letter_url:    { type: DataTypes.STRING, allowNull: true },
  letter_sent_at:{ type: DataTypes.DATE, allowNull: true },
  status:        { type: DataTypes.ENUM("Extended", "Accepted", "Declined", "Revoked", "Lapsed"), defaultValue: "Extended" },
}, {
  tableName: "placement_offers",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }, { fields: ["company_id"] }, { fields: ["status"] }],
});

Application.hasMany(Offer, { foreignKey: "application_id", as: "offers" });
Offer.belongsTo(Application, { foreignKey: "application_id", as: "application" });
PlacementStudent.hasMany(Offer, { foreignKey: "student_id", as: "offers" });
Offer.belongsTo(PlacementStudent, { foreignKey: "student_id", as: "student" });

export { Offer };
