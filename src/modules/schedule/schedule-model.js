import { DataTypes } from "sequelize";
import sequelize from "../../database/connection.js";

const OfficeHour = sequelize.define("OfficeHour", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  day: { type: DataTypes.STRING, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  room: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "workspace_office_hours", timestamps: true, underscored: true });

const TimetableEntry = sequelize.define("TimetableEntry", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  courseName: { type: DataTypes.STRING, allowNull: false },
  courseCode: { type: DataTypes.STRING, allowNull: true },
  day: { type: DataTypes.STRING, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  room: { type: DataTypes.STRING, allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: "workspace_timetable_entries", timestamps: true, underscored: true });

const ScheduledMeeting = sequelize.define("ScheduledMeeting", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: true },
  attendees: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  type: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Scheduled" },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "workspace_scheduled_meetings", timestamps: true, underscored: true });

const MeetingRequest = sequelize.define("MeetingRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentName: { type: DataTypes.STRING, allowNull: false },
  studentEmail: { type: DataTypes.STRING, allowNull: true },
  courseName: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
  venue: { type: DataTypes.STRING, allowNull: true },
  link: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true },
  rescheduleReason: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "workspace_meeting_requests", timestamps: true, underscored: true });

const OutgoingMeetingRequest = sequelize.define("OutgoingMeetingRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  recipientName: { type: DataTypes.STRING, allowNull: false },
  recipientEmail: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  topic: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
}, { tableName: "workspace_outgoing_meeting_requests", timestamps: true, underscored: true });

export { OfficeHour, TimetableEntry, ScheduledMeeting, MeetingRequest, OutgoingMeetingRequest };
