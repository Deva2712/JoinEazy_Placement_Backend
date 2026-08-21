// src/modules/overview/overview-routes.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./overview-controller.js";

const router = express.Router();
router.use(protect);

router.get("/overview",              ctrl.student);      // the signed-in student
router.get("/coord/overview",        authorize(...PLACEMENT_STAFF), ctrl.coordinator);
router.get("/hod/overview",          authorize(...PLACEMENT_STAFF), ctrl.hod);
router.get("/history/batch-totals",  authorize(...PLACEMENT_STAFF), ctrl.batchTotals);

export default router;
