// src/modules/training/training-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import {
  service, sessions, attendance, tests, scores,
  instructorPrograms, assertMayWriteCourse,
} from "./training-service.js";

const c = crudController(service);

// ─── Programs (courses) ──────────────────────────────────────────────────────
export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);

/** GET /training/instructors/:instructorId/programs */
export const programsForInstructor = asyncHandler(async (req, res) => {
  // A professor may only ask for their own programs; the coordinator may ask
  // about anyone's. Without this, the id in the path is an open directory.
  const wanted = req.params.instructorId === "me" ? req.user.id : req.params.instructorId;
  if (req.user.role !== "placement_coordinator" && wanted !== req.user.id) {
    const e = new Error("You may only read your own programs");
    e.statusCode = 403;
    throw e;
  }
  res.json({ success: true, data: await instructorPrograms(wanted) });
});

// ─── Sessions (classes) ──────────────────────────────────────────────────────
export const listSessions = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await sessions.list({
    courseId: req.query.courseId, instructorId: req.query.instructorId,
  }) }));

export const createSession = asyncHandler(async (req, res) => {
  await assertMayWriteCourse(req.user, req.body.course_id || req.body.courseId);
  res.status(201).json({ success: true, data: await sessions.create(req.body) });
});

export const updateSession = asyncHandler(async (req, res) => {
  await assertMayWriteCourse(req.user, await sessions.courseIdOf(req.params.id));
  res.json({ success: true, data: await sessions.update(req.params.id, req.body) });
});

export const removeSession = asyncHandler(async (req, res) => {
  await assertMayWriteCourse(req.user, await sessions.courseIdOf(req.params.id));
  res.json({ success: true, data: await sessions.remove(req.params.id) });
});

// ─── Attendance ──────────────────────────────────────────────────────────────
export const sessionAttendance = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await attendance.forSession(req.params.id) }));

export const studentAttendance = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await attendance.forStudent(req.params.studentId) }));

/** POST /training/sessions/:id/attendance — one row or a whole class. */
export const markAttendance = asyncHandler(async (req, res) => {
  await assertMayWriteCourse(req.user, await sessions.courseIdOf(req.params.id));
  const rows = Array.isArray(req.body) ? req.body : [req.body];
  res.json({ success: true, data: await attendance.mark(req.params.id, rows, req.user.id) });
});

// ─── Tests and scores ────────────────────────────────────────────────────────
export const listTests = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await tests.list({ courseId: req.query.courseId }) }));

export const createTest = asyncHandler(async (req, res) => {
  await assertMayWriteCourse(req.user, req.body.course_id || req.body.courseId);
  res.status(201).json({ success: true, data: await tests.create(req.body) });
});

export const testScores = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await scores.forTest(req.params.id) }));

export const studentScores = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await scores.forStudent(req.params.studentId) }));

/** POST /training/tests/:id/scores — one score or a whole sheet. */
export const recordScores = asyncHandler(async (req, res) => {
  await assertMayWriteCourse(req.user, await tests.courseIdOf(req.params.id));
  const rows = Array.isArray(req.body) ? req.body : [req.body];
  res.json({ success: true, data: await scores.record(req.params.id, rows, req.user.id) });
});
