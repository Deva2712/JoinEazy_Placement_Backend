import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./user-controller.js";

const router = express.Router();
router.use(protect);

router.get("/dashboard-overview", ctrl.dashboardOverview);

export default router;
