// src/modules/jobs/jobs-routes.js
// Mounted twice in app.js: at /placement/jobs and /placement/drives, because
// the frontend uses both names for the same resource.
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./jobs-controller.js";

const router = express.Router();
router.use(protect);

// Literal paths before /:id so "open" is never read as an id.
router.get("/open", ctrl.openForStudent);

router.get("/",    ctrl.list);
router.post("/",   authorize(...PLACEMENT_STAFF), ctrl.create);

// ─── Drive sub-resources ─────────────────────────────────────────────────────
router.get("/:jobId/rounds",     ctrl.listRounds);
router.post("/:jobId/rounds",    authorize(...PLACEMENT_STAFF), ctrl.addRound);
router.get("/:jobId/applicants", authorize(...PLACEMENT_STAFF), ctrl.applicants);
router.post("/:jobId/advance",   authorize(...PLACEMENT_STAFF), ctrl.advance);
router.post("/:jobId/rounds/:roundId/outcomes",        authorize(...PLACEMENT_STAFF), ctrl.recordOutcomes);
router.post("/:jobId/rounds/:roundId/outcomes/revert", authorize(...PLACEMENT_STAFF), ctrl.revertOutcomes);

router.get("/:id",    ctrl.get);
router.put("/:id",    authorize(...PLACEMENT_STAFF), ctrl.update);
router.delete("/:id", authorize(...PLACEMENT_STAFF), ctrl.remove);

export default router;
