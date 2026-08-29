// src/modules/training/training-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./training-service.js";

const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });

// ─── Courses (the router's root resource) ─────────────────────────────────────
export const list   = asyncHandler(async (req, res) => ok(res, await service.listCourses(req.query)));
export const get    = asyncHandler(async (req, res) => ok(res, await service.get(req.params.id)));
export const create = asyncHandler(async (req, res) => ok(res, await service.createCourse(req.body), 201));
export const update = asyncHandler(async (req, res) => ok(res, await service.updateCourse(req.params.id, req.body)));
export const remove = asyncHandler(async (req, res) => ok(res, await service.deleteCourse(req.params.id)));

// ─── Instructors ──────────────────────────────────────────────────────────────
export const listInstructors = asyncHandler(async (req, res) => ok(res, await service.listInstructors()));

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const listSessions  = asyncHandler(async (req, res) => ok(res, await service.listSessions(req.query)));
export const getSession    = asyncHandler(async (req, res) => ok(res, await service.getSession(req.params.id)));
export const createSession = asyncHandler(async (req, res) => ok(res, await service.createSession(req.body), 201));
export const updateSession = asyncHandler(async (req, res) => ok(res, await service.updateSession(req.params.id, req.body)));
export const deleteSession = asyncHandler(async (req, res) => ok(res, await service.deleteSession(req.params.id)));

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceForSession = asyncHandler(async (req, res) =>
  ok(res, await service.attendanceForSession(req.params.sessionId)));

export const attendanceForStudent = asyncHandler(async (req, res) =>
  ok(res, await service.attendanceForStudent(req.params.studentId)));

export const markAttendance = asyncHandler(async (req, res) =>
  ok(res, await service.markAttendance(req.body, req.user?.id)));

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const entries = Array.isArray(req.body) ? req.body : req.body?.entries;
  ok(res, await service.bulkMarkAttendance(entries, req.user?.id));
});

// ─── Tests & scores ───────────────────────────────────────────────────────────
export const listTests  = asyncHandler(async (req, res) => ok(res, await service.listTests(req.query)));
export const getTest    = asyncHandler(async (req, res) => ok(res, await service.getTest(req.params.id)));
export const createTest = asyncHandler(async (req, res) => ok(res, await service.createTest(req.body), 201));
export const updateTest = asyncHandler(async (req, res) => ok(res, await service.updateTest(req.params.id, req.body)));
export const deleteTest = asyncHandler(async (req, res) => ok(res, await service.deleteTest(req.params.id)));

export const listScores = asyncHandler(async (req, res) => ok(res, await service.listScores(req.query)));
export const addScore   = asyncHandler(async (req, res) => ok(res, await service.addScore(req.body), 201));
export const updateScore= asyncHandler(async (req, res) => ok(res, await service.updateScore(req.params.id, req.body)));

// ─── Enrolments ───────────────────────────────────────────────────────────────
export const listEnrollments = asyncHandler(async (req, res) => ok(res, await service.listEnrollments(req.query)));
export const enroll = asyncHandler(async (req, res) => ok(res, await service.enroll(req.body), 201));
