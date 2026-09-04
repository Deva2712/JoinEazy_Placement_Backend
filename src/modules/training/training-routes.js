// src/modules/training/training-routes.js
//
// Training is the one module a professor writes to. The route guard only gets
// them through the door (TRAINING_WRITE); `assertMayWriteCourse` in the
// controller then checks the program is actually theirs — a coordinator passes
// both, a professor only for programs they instruct.
import express from "express";
import { protect, authorize, COORD_ONLY, TRAINING_WRITE } from "../../middleware/auth.middleware.js";
import * as ctrl from "./training-controller.js";

const router = express.Router();
router.use(protect);

// ─── Literal paths first, so "sessions"/"tests" are never read as a course id ─
router.get("/sessions",                 ctrl.listSessions);
router.post("/sessions",                authorize(...TRAINING_WRITE), ctrl.createSession);
router.put("/sessions/:id",             authorize(...TRAINING_WRITE), ctrl.updateSession);
router.delete("/sessions/:id",          authorize(...TRAINING_WRITE), ctrl.removeSession);
router.get("/sessions/:id/attendance",  ctrl.sessionAttendance);
router.post("/sessions/:id/attendance", authorize(...TRAINING_WRITE), ctrl.markAttendance);

router.get("/tests",                    ctrl.listTests);
router.post("/tests",                   authorize(...TRAINING_WRITE), ctrl.createTest);
router.get("/tests/:id/scores",         ctrl.testScores);
router.post("/tests/:id/scores",        authorize(...TRAINING_WRITE), ctrl.recordScores);

router.get("/instructors/:instructorId/programs", authorize(...TRAINING_WRITE), ctrl.programsForInstructor);

// A student's own training record — the Training tab of /placement.
router.get("/students/:studentId/attendance", ctrl.studentAttendance);
router.get("/students/:studentId/scores",     ctrl.studentScores);

// ─── Programs (courses) ──────────────────────────────────────────────────────
// Reads are open to any authenticated user; creating and deleting a program is
// the coordinator's call, not an instructor's.
router.get("/",        ctrl.list);
router.get("/:id",     ctrl.get);
router.post("/",       authorize(...COORD_ONLY), ctrl.create);
router.put("/:id",     authorize(...COORD_ONLY), ctrl.update);
router.delete("/:id",  authorize(...COORD_ONLY), ctrl.remove);

export default router;
