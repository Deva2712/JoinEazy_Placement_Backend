// src/modules/applications/applications-routes.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./applications-controller.js";

const router = express.Router();
router.use(protect);

// "mine" and "status" are literals — declared before /:id.
router.get("/mine",    ctrl.mine);
router.put("/status",  authorize(...PLACEMENT_STAFF), ctrl.setStatusBulk);

router.get("/",           authorize(...PLACEMENT_STAFF), ctrl.list);
router.get("/:id",        ctrl.get);
router.put("/:id/status", authorize(...PLACEMENT_STAFF), ctrl.setStatus);
router.delete("/:id",     ctrl.remove);   // a student may withdraw

export default router;

// ─── Apply ───────────────────────────────────────────────────────────────────
// Mounted separately at /placement/apply because the frontend posts to
// /placement/apply/:jobId — the verb sits in the path, not under /applications.
export const applyRouter = express.Router();
applyRouter.use(protect);
applyRouter.post("/:jobId", ctrl.apply);
