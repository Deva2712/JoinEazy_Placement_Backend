// src/modules/training/training-routes.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./training-controller.js";

const router = express.Router();
router.use(protect);

const staff = authorize(...PLACEMENT_STAFF);

// Literal sub-resources first — "/sessions" must not be captured by "/:id".
//
// Attendance marking is deliberately NOT staff-gated: a student registers for a
// session themselves (registered: true), and the professor teaching a session
// marks its register. PLACEMENT_STAFF excludes `professor` by design, so gating
// this would lock out the people who actually take attendance.
router.get("/instructors",  ctrl.listInstructors);

router.get("/sessions",       ctrl.listSessions);
router.post("/sessions",      staff, ctrl.createSession);
router.get("/sessions/:sessionId/attendance", ctrl.attendanceForSession);
router.get("/sessions/:id",   ctrl.getSession);
router.patch("/sessions/:id", staff, ctrl.updateSession);
router.delete("/sessions/:id", staff, ctrl.deleteSession);

router.get("/attendance/student/:studentId", ctrl.attendanceForStudent);
router.post("/attendance",      ctrl.markAttendance);
router.post("/attendance/bulk", ctrl.bulkMarkAttendance);

router.get("/tests",       ctrl.listTests);
router.post("/tests",      staff, ctrl.createTest);
router.get("/tests/:id",   ctrl.getTest);
router.patch("/tests/:id", staff, ctrl.updateTest);
router.delete("/tests/:id", staff, ctrl.deleteTest);

router.get("/scores",       ctrl.listScores);
router.post("/scores",      staff, ctrl.addScore);
router.patch("/scores/:id", staff, ctrl.updateScore);

router.get("/enrollments",  ctrl.listEnrollments);
router.post("/enrollments", ctrl.enroll);

// Courses — the router's root resource.
router.get("/",        ctrl.list);
router.post("/",       staff, ctrl.create);
router.get("/:id",     ctrl.get);
router.patch("/:id",   staff, ctrl.update);
router.delete("/:id",  staff, ctrl.remove);

export default router;
