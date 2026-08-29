// src/modules/overview/overview-routes.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./overview-controller.js";

const router = express.Router();
router.use(protect);

router.get("/overview",              ctrl.student);      // the signed-in student
router.get("/coord/overview",        authorize(...PLACEMENT_STAFF), ctrl.coordinator);

// Analytics history. Reads are open to any authenticated user: the professor
// and HOD dashboards below are read-only views over the same rows, and
// PLACEMENT_STAFF deliberately excludes `professor`.
router.get("/history/students",      ctrl.pastPlacedStudents);
router.get("/history/batch-totals",  ctrl.batchTotals);

// Professor (single branch) and HOD (branches[]) dashboards.
router.get("/prof/overview",         ctrl.profOverview);
router.get("/prof/active-drives",    ctrl.activeDrives);
router.get("/hod/overview",          ctrl.hodOverview);
router.get("/hod/active-drives",     ctrl.activeDrives);
router.get("/hod/current-students",  ctrl.currentStudents);

// Aggregate KPI variant of the HOD view (branch/batchYear scalars). Kept for
// the skeleton's original consumer; the frontend calls /hod/overview above.
router.get("/hod/summary",           authorize(...PLACEMENT_STAFF), ctrl.hod);

export default router;
