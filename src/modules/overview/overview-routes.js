// src/modules/overview/overview-routes.js
//
// The four dashboards, one per role. Each is a read — this module owns no
// tables — but they differ in how much of the cohort they may see:
//
//   student  → only their own row              (/overview)
//   coord    → everything, unscoped            (/coord/*)
//   prof     → one branch, from their token    (/prof/*)
//   hod      → their department's branches     (/hod/*)
//
// Paths match what Placement-Frontend already calls in
// src/api/services/placement.service.js, so wiring it off mocks is a base-URL
// change rather than a rewrite.
import express from "express";
import { protect, authorize, branchScope, COORD_ONLY, STAFF_READ } from "../../middleware/auth.middleware.js";
import * as ctrl from "./overview-controller.js";

const router = express.Router();
router.use(protect);

// ─── Student ─────────────────────────────────────────────────────────────────
router.get("/overview", ctrl.student);

// ─── Coordinator ─────────────────────────────────────────────────────────────
router.get("/coord/overview", authorize(...COORD_ONLY), ctrl.coordinator);

// ─── Professor (single branch, read-only) ────────────────────────────────────
router.get("/prof/overview",      authorize(...STAFF_READ), branchScope, ctrl.branchOverview);
router.get("/prof/active-drives", authorize(...STAFF_READ), branchScope, ctrl.activeDrives);

// ─── HoD (several branches, read-only) ───────────────────────────────────────
router.get("/hod/overview",         authorize(...STAFF_READ), branchScope, ctrl.branchOverview);
router.get("/hod/active-drives",    authorize(...STAFF_READ), branchScope, ctrl.activeDrives);
router.get("/hod/current-students", authorize(...STAFF_READ), branchScope, ctrl.currentStudents);

// ─── Shared history (all three staff roles read it) ──────────────────────────
// Prof and HoD both plot placement rates per batch, so batch totals cannot be
// coordinator-only. Scoped the same way as everything else.
router.get("/history/batch-totals", authorize(...STAFF_READ), branchScope, ctrl.batchTotals);
router.get("/history/students",     authorize(...STAFF_READ), branchScope, ctrl.pastPlaced);

export default router;
