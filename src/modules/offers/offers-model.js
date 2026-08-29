// src/modules/offers/offers-model.js
import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";
import { Application } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";

/**
 * A job offer extended to a student. Accepting one is what marks them Placed.
 *
 * Attribute names are camelCase (`underscored: true` keeps the columns
 * snake_case, so this rename needed no migration) — matching Company, Job,
 * Application, InterviewSlot and the shapes the frontend actually sends.
 *
 * Two deliberate deviations from the original skeleton, both driven by the
 * frontend contract (src/api/services/placement.service.js + OfferModal.jsx):
 *
 *   ctc — the frontend sends and reads ONE field, a formatted string
 *     ("30 LPA", "₹18–22 LPA", "40k/month"). The skeleton had ctc FLOAT plus a
 *     separate ctc_display STRING, which no caller ever populates. `ctc` is now
 *     the string of record; `ctcValue` holds the parsed number that analytics
 *     aggregates over, derived on write so nothing has to parse at query time.
 *
 *   status — the skeleton's Extended/Declined/Revoked/Lapsed vocabulary is not
 *     what the UI sends. OFFER_STATUSES in the frontend's
 *     placementCoordConstants.js is exactly ["Pending","Accepted","Rejected",
 *     "Withdrawn"], and OffersTab/OfferDetailModal branch on those literals.
 */
const Offer = sequelize.define("Offer", {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  applicationId: { type: DataTypes.UUID, allowNull: true },
  jobId:         { type: DataTypes.UUID, allowNull: true },
  studentId:     { type: DataTypes.UUID, allowNull: false },
  studentName:   { type: DataTypes.STRING, allowNull: true },
  // Denormalised so an offer card can show a roll number without a roster join.
  studentRollNo: { type: DataTypes.STRING, allowNull: true },
  studentBranch: { type: DataTypes.STRING, allowNull: true },
  companyId:     { type: DataTypes.UUID, allowNull: true },
  companyName:   { type: DataTypes.STRING, allowNull: true },
  role:          { type: DataTypes.STRING, allowNull: true },
  // Display string exactly as the coordinator typed it — the frontend's own
  // helpers (offersHelpers.isStipend, topOfPackage) parse this shape already.
  ctc:           { type: DataTypes.STRING, allowNull: true },
  // Parsed LPA figure for aggregation. Null for stipends/unparseable input, so
  // averages never silently fold a monthly number into a yearly one.
  ctcValue:      { type: DataTypes.FLOAT, allowNull: true },
  joiningDate:   { type: DataTypes.DATEONLY, allowNull: true },
  location:      { type: DataTypes.STRING, allowNull: true },
  sector:        { type: DataTypes.STRING, allowNull: true },
  // Pre-placement offer converted from an internship.
  ppo:           { type: DataTypes.BOOLEAN, defaultValue: false },
  // Student sourced this themselves — no campus drive, no MoU. Kept on the
  // offer (not only on OffCampusRecord) because the coordinator can tick
  // "Off-campus offer" straight in OfferModal without a verification workflow.
  offCampus:     { type: DataTypes.BOOLEAN, defaultValue: false },
  letterUrl:     { type: DataTypes.STRING, allowNull: true },
  letterFileName:{ type: DataTypes.STRING, allowNull: true },
  letterSentAt:  { type: DataTypes.DATE, allowNull: true },
  status:        { type: DataTypes.ENUM("Pending", "Accepted", "Rejected", "Withdrawn"), defaultValue: "Pending" },
}, {
  tableName: "placement_offers",
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ["student_id"] }, { fields: ["company_id"] }, { fields: ["status"] }],
});

Application.hasMany(Offer, { foreignKey: "applicationId", as: "offers" });
Offer.belongsTo(Application, { foreignKey: "applicationId", as: "application" });
PlacementStudent.hasMany(Offer, { foreignKey: "studentId", as: "offers" });
Offer.belongsTo(PlacementStudent, { foreignKey: "studentId", as: "student" });

export { Offer };
