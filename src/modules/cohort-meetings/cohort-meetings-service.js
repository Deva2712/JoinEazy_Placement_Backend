// src/modules/cohort-meetings/cohort-meetings-service.js
import CohortMeeting from "./cohort-meetings-model.js";

export const getMeetings = async (cohortId) => {
  const meetings = await CohortMeeting.findAll({
    where: { cohort_id: cohortId },
    order: [["scheduled_at", "DESC"]],
  });
  return meetings.map((m) => m.toJSON());
};

export const createMeeting = async (cohortId, data, author) => {
  const meeting = await CohortMeeting.create({
    cohort_id:       cohortId,
    created_by:      author.id,
    created_by_name: author.name || author.email || "Placement Coordinator",
    title:           data.title,
    description:     data.description || null,
    meeting_url:     data.meetingUrl || data.meeting_url || null,
    platform:        data.platform || "zoom",
    scheduled_at:    data.scheduledAt || data.scheduled_at,
    duration_mins:   data.durationMins || data.duration_mins || 60,
  });
  return meeting.toJSON();
};

export const updateMeeting = async (cohortId, meetingId, data, authorId) => {
  const meeting = await CohortMeeting.findOne({ where: { id: meetingId, cohort_id: cohortId } });
  if (!meeting) { const e = new Error("Meeting not found"); e.statusCode = 404; throw e; }
  if (meeting.created_by !== authorId) { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await meeting.update({
    title:         data.title         ?? meeting.title,
    description:   data.description   ?? meeting.description,
    meeting_url:   data.meetingUrl    ?? meeting.meeting_url,
    scheduled_at:  data.scheduledAt   ?? meeting.scheduled_at,
    duration_mins: data.durationMins  ?? meeting.duration_mins,
    status:        data.status        ?? meeting.status,
  });
  return meeting.toJSON();
};

export const deleteMeeting = async (cohortId, meetingId, authorId, userRole) => {
  const meeting = await CohortMeeting.findOne({ where: { id: meetingId, cohort_id: cohortId } });
  if (!meeting) { const e = new Error("Meeting not found"); e.statusCode = 404; throw e; }
  if (meeting.created_by !== authorId && userRole !== "admin") { const e = new Error("Not authorized"); e.statusCode = 403; throw e; }
  await meeting.destroy();
  return { deleted: true };
};
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const getStudentMeetings = async (cohortId, studentId) => {
  if (!isValidUUID(cohortId) || !isValidUUID(studentId)) return [];
  return (await CohortMeeting.findAll({
    where: { cohort_id: cohortId },
    order: [["scheduled_at", "ASC"]],
  })).map(m => m.toJSON());
};

export const getStudentMeetingRequests = async (cohortId, studentId) => {
  if (!isValidUUID(cohortId) || !isValidUUID(studentId)) return [];
  return [];
};

export const createMeetingRequest = async (cohortId, studentId, data) =>
  (await CohortMeeting.create({
    cohort_id: cohortId,
    created_by: studentId,
    created_by_name: data.student_name || data.studentName || "Student",
    title: data.title || "Meeting request",
    description: data.description || null,
    scheduled_at: data.proposed_date || data.proposedDate || new Date(),
    status: "scheduled",
  })).toJSON();

export const cancelMeetingRequest = async (cohortId, requestId, studentId) => {
  const m = await CohortMeeting.findOne({ where: { id: requestId, cohort_id: cohortId, created_by: studentId } });
  if (!m) { const e = new Error("Not found"); e.statusCode = 404; throw e; }
  await m.destroy(); return { deleted: true };
};
