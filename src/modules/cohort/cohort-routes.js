import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/:cohortId/announcements", ctrl.announcements);
router.post("/:cohortId/announcements", authorize(...PLACEMENT_STAFF), ctrl.createAnnouncement);

export default router;
