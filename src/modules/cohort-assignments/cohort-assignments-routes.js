import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-assignments-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/submissions/status",              ctrl.getSubmissionStatus);       // GET  /assignments/submissions/status
router.get("/",                                ctrl.getAssignments);            // GET  /assignments
router.post("/",   authorize(...PLACEMENT_STAFF), ctrl.createAssignment);      // POST /assignments
router.get("/:assignmentId/submissions",       ctrl.getSubmissions);            // GET  /assignments/:id/submissions
router.post("/:assignmentId/submit",           ctrl.markSubmitted);             // POST /assignments/:id/submit
router.delete("/:assignmentId/submit",         ctrl.unmarkSubmitted);           // DELETE /assignments/:id/submit
router.put("/:assignmentId",   authorize(...PLACEMENT_STAFF), ctrl.updateAssignment);
router.delete("/:assignmentId", authorize(...PLACEMENT_STAFF), ctrl.deleteAssignment);

export default router;
