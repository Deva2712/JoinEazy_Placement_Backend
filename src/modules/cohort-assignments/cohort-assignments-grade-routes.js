// Mounted at /api/v1/cohort/assignments in app.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-assignments-controller.js";

const router = express.Router();
router.use(protect);

// POST /api/v1/cohort/assignments/:assignmentId/grade
router.post("/:assignmentId/grade", authorize(...PLACEMENT_STAFF), ctrl.gradeSubmission);

router.post("/:assignmentId/grade-group", authorize(...PLACEMENT_STAFF), ctrl.gradeGroupAssignment);
export default router;
