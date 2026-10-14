// src/modules/interviews/interviews-service.js
//
// Generic CRUD plus slot creation. The frontend calls two entry points for the
// same action — POST /applications/:id/interview for one candidate and
// POST /interviews/batch for a cohort — so slot creation lives here once and
// both controllers delegate to it.
//
// Field-name note: the frontend sends and reads `datetime`; the column is
// `scheduledAt`. Reads emit both so neither side has to change.
import { InterviewSlot } from "./interviews-model.js";
import { Application } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(InterviewSlot, { order: [["scheduledAt", "ASC"]] });

// `datetime` is the frontend's name for scheduledAt, and `studentId` is a roll
// number on that side — the UUID would otherwise render as a raw id badge.
const toApi = (row) => ({
  ...row,
  datetime: row.scheduledAt,
  studentId: row.studentRollNo ?? row.studentId,
});

/**
 * Round number = one past the highest existing round for this application.
 * Cancelled rounds still count, so numbering stays monotonic rather than
 * silently reusing a number a candidate has already seen.
 */
const nextRound = async (applicationId) => {
  const existing = await InterviewSlot.findAll({
    where: { applicationId },
    attributes: ["round"],
    raw: true,
  });
  return existing.reduce((max, s) => Math.max(max, s.round || 0), 0) + 1;
};

/** Create one slot from the frontend's payload shape. */
const createSlot = async (payload = {}) => {
  const { applicationId } = payload;
  if (!applicationId) badRequest("applicationId is required");

  const app = await Application.findByPk(applicationId);
  if (!app) notFound("Application not found");

  // `datetime` is the frontend's name; scheduledAt/scheduled_at accepted too so
  // the existing per-application route keeps working for any caller using them.
  const when = payload.datetime || payload.scheduledAt || payload.scheduled_at;
  if (!when) badRequest("datetime is required");

  const mode = payload.mode || "Online";
  const slot = await InterviewSlot.create({
    applicationId,
    jobId: app.jobId,
    studentId: app.studentId,
    studentName: app.studentName,
    studentRollNo: app.studentRoll
      ?? (await PlacementStudent.findOne({ where: { userId: app.studentId } }))?.rollNo
      ?? null,
    round: payload.round || await nextRound(applicationId),
    // Ties the slot to a specific selection round when scheduled from Manage
    // Rounds; null for ad-hoc per-application scheduling.
    roundId: payload.roundId || null,
    type: payload.type || "General",
    scheduledAt: when,
    durationMins: Number(payload.durationMins || payload.duration_mins) || 60,
    mode,
    // Only the field the mode actually uses is stored — otherwise a slot
    // switched Online→Offline keeps a stale meeting link the UI would render.
    location: mode === "Offline" ? (payload.location || null) : null,
    link: mode === "Online" ? (payload.link || null) : null,
    panelMembers: Array.isArray(payload.panelMembers) ? payload.panelMembers : [],
    notes: payload.notes || null,
    status: "Scheduled",
  });

  // Scheduling is what moves the candidate into the interview stage; without
  // this the ATS board never advances once the mock layer is off.
  if (app.status !== "Interview Scheduled") await app.update({ status: "Interview Scheduled" });

  return toApi(slot.toJSON());
};

/**
 * Cancelling the last live round would otherwise strand the application at
 * "Interview Scheduled" with nothing behind it, so it drops back into the
 * schedulable pool. Candidates who have already advanced past interviews are
 * left alone — cancelling a historical round must not un-select them.
 */
const revertIfNoLiveRounds = async (applicationId) => {
  if (!applicationId) return;
  const app = await Application.findByPk(applicationId);
  if (!app || app.status !== "Interview Scheduled") return;
  const live = await InterviewSlot.count({ where: { applicationId, status: "Scheduled" } });
  if (live === 0) await app.update({ status: "Shortlisted" });
};

export const service = {
  ...base,

  list: async (query) => (await base.list(query)).map(toApi),
  get:  async (id) => toApi(await base.get(id)),

  create: createSlot,

  /** POST /placement/interviews/batch — body { slots: [...] }. */
  createBatch: async (slots = []) => {
    if (!Array.isArray(slots)) badRequest("Expected { slots: [...] }");
    const created = [];
    const failed = [];
    for (const [i, s] of slots.entries()) {
      try {
        created.push(await createSlot(s));
      } catch (err) {
        failed.push({ index: i, applicationId: s?.applicationId ?? null, error: err.message });
      }
    }
    return { scheduled: created.length, failed: failed.length, data: created, errors: failed };
  },

  update: async (id, data) => {
    const row = await InterviewSlot.findByPk(id);
    if (!row) notFound("Interview not found");
    const patch = { ...data };
    if (data.datetime) patch.scheduledAt = data.datetime;
    const mode = data.mode || row.mode;
    if (data.mode || "location" in data || "link" in data) {
      patch.mode = mode;
      patch.location = mode === "Offline" ? (data.location ?? row.location) : null;
      patch.link = mode === "Online" ? (data.link ?? row.link) : null;
    }
    await row.update(patch);
    if (patch.status && patch.status !== "Scheduled") await revertIfNoLiveRounds(row.applicationId);
    return toApi(row.toJSON());
  },

  /** DELETE — the UI calls this "cancel"; the row is kept for the audit trail. */
  remove: async (id) => {
    const row = await InterviewSlot.findByPk(id);
    if (!row) notFound("Interview not found");
    await row.update({ status: "Cancelled" });
    await revertIfNoLiveRounds(row.applicationId);
    return { cancelled: true, id };
  },
};
