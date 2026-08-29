// src/modules/tasks/offcampus-routes.js
//
// Coordinator-managed only — off-campus/self-sourced internships are recorded
// and verified by the placement cell, not self-reported by students directly.
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./offcampus-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/",        ctrl.list);
router.get("/:id",     ctrl.get);
router.post("/",       ctrl.create);
router.patch("/:id",   ctrl.update);
router.delete("/:id",  ctrl.remove);

export default router;
