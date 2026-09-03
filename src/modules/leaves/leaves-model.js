import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const LeaveApplication = sequelize.define("LeaveApplication", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  facultyName: { type: DataTypes.STRING, allowNull: false },
  leaveType: { type: DataTypes.STRING, allowNull: false },
  fromDate: { type: DataTypes.DATEONLY, allowNull: false },
  toDate: { type: DataTypes.DATEONLY, allowNull: false },
  courseName: { type: DataTypes.STRING, allowNull: true },
  roomNumber: { type: DataTypes.STRING, allowNull: true },
  timings: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  note: { type: DataTypes.TEXT, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false },
  replacementFaculty: { type: DataTypes.STRING, allowNull: true },
  substitutionStatus: { type: DataTypes.STRING, defaultValue: "Pending" },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
  appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  leaveApproval: { type: DataTypes.JSON, allowNull: false, defaultValue: { HoD: { status: "Pending", remark: null }, HR: { status: "Pending", remark: null } } },
  supporting_doc_link: { type: DataTypes.STRING, allowNull: true },
  supporting_doc_file: { type: DataTypes.JSON, allowNull: true },
  previousVersion: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: "workspace_leave_applications",
  timestamps: true,
  underscored: true,
});

const LeaveSubstitutionRequest = sequelize.define("LeaveSubstitutionRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requesterName: { type: DataTypes.STRING, allowNull: false },
  leaveType: { type: DataTypes.STRING, allowNull: false },
  fromDate: { type: DataTypes.DATEONLY, allowNull: false },
  toDate: { type: DataTypes.DATEONLY, allowNull: false },
  courseName: { type: DataTypes.STRING, allowNull: true },
  roomNumber: { type: DataTypes.STRING, allowNull: true },
  timings: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  reason: { type: DataTypes.TEXT, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
}, {
  tableName: "workspace_leave_substitution_requests",
  timestamps: true,
  underscored: true,
});

export { LeaveApplication, LeaveSubstitutionRequest };
