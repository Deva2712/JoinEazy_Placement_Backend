import { MeetingRequest, OfficeHour, OutgoingMeetingRequest, ScheduledMeeting, TimetableEntry } from "./schedule-model.js";

const byDayTime = [["day", "ASC"], ["startTime", "ASC"]];

const notFound = (msg) => {
  const err = new Error(msg);
  err.statusCode = 404;
  throw err;
};

const splitDateTime = (value, fallbackDate, fallbackTime) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return { date: fallbackDate, startTime: fallbackTime };
  return { date: date.toISOString().slice(0, 10), startTime: date.toISOString().slice(11, 16) };
};

export const service = {
  overview: async () => ({
    scheduledMeetings: (await ScheduledMeeting.findAll({ order: [["date", "ASC"], ["startTime", "ASC"]] })).map((r) => r.toJSON()),
    schedule: {
      officeHours: (await OfficeHour.findAll({ order: byDayTime })).map((r) => r.toJSON()),
      timetable: (await TimetableEntry.findAll({ order: byDayTime })).map((r) => r.toJSON()),
    },
    meetingRequests: (await MeetingRequest.findAll({ order: [["date", "ASC"], ["startTime", "ASC"]] })).map((r) => r.toJSON()),
    outgoingRequests: (await OutgoingMeetingRequest.findAll({ order: [["date", "ASC"], ["startTime", "ASC"]] })).map((r) => r.toJSON()),
  }),
  updateSchedule: async ({ officeHours, timetable }) => {
    if (officeHours) {
      await OfficeHour.destroy({ where: {} });
      await OfficeHour.bulkCreate(officeHours);
    }
    if (timetable) {
      await TimetableEntry.destroy({ where: {} });
      await TimetableEntry.bulkCreate(timetable);
    }
    return service.overview();
  },
  createMeeting: async (data) => (await ScheduledMeeting.create(data)).toJSON(),
  accept: async (id, data) => {
    const row = await MeetingRequest.findByPk(id);
    if (!row) notFound("Meeting request not found");
    await row.update({ status: "Accepted", venue: data.venue ?? null, link: data.link ?? null, notes: data.notes ?? null });
    await ScheduledMeeting.create({
      title: `Meeting with ${row.studentName}`,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      location: data.venue || data.link || "TBD",
      attendees: [row.studentEmail].filter(Boolean),
      type: "Request",
      status: "Scheduled",
      description: row.reason,
    });
    return row.toJSON();
  },
  reject: async (id, { reason }) => {
    const row = await MeetingRequest.findByPk(id);
    if (!row) notFound("Meeting request not found");
    await row.update({ status: "Rejected", rejectionReason: reason ?? null });
    return row.toJSON();
  },
  reschedule: async (id, { newDateTime, reason }) => {
    const row = await MeetingRequest.findByPk(id);
    if (!row) notFound("Meeting request not found");
    const next = splitDateTime(newDateTime, row.date, row.startTime);
    await row.update({ status: "Rescheduled", ...next, rescheduleReason: reason ?? null });
    return row.toJSON();
  },
};
