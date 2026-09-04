// src/modules/jobs/jobs-routes.js
// Mounted twice in app.js: at /placement/jobs and /placement/drives, because
// the frontend uses both names for the same resource.
import express from "express";
import { protect, authorize, COORD_ONLY } from "../../middleware/auth.middleware.js";
import * as ctrl from "./jobs-controller.js";

const router = express.Router();
router.use(protect);

// Literal paths before /:id so "open" is never read as an id.
router.get("/open", ctrl.openForStudent);

router.get("/",    ctrl.list);
router.post("/",   authorize(...COORD_ONLY), ctrl.create);

// ─── Drive sub-resources ─────────────────────────────────────────────────────
router.get("/:jobId/rounds",     ctrl.listRounds);
router.post("/:jobId/rounds",    authorize(...COORD_ONLY), ctrl.addRound);
router.get("/:jobId/applicants", authorize(...COORD_ONLY), ctrl.applicants);
router.post("/:jobId/advance",   authorize(...COORD_ONLY), ctrl.advance);
router.post("/:jobId/rounds/:roundId/outcomes",        authorize(...COORD_ONLY), ctrl.recordOutcomes);
router.post("/:jobId/rounds/:roundId/outcomes/revert", authorize(...COORD_ONLY), ctrl.revertOutcomes);

router.get("/:id",    ctrl.get);
router.put("/:id",    authorize(...COORD_ONLY), ctrl.update);
router.delete("/:id", authorize(...COORD_ONLY), ctrl.remove);

export default router;
