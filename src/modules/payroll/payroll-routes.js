import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./payroll-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/history", ctrl.history);
router.get("/breakdown", ctrl.breakdown);
router.get("/download/:id", ctrl.download);

export default router;
