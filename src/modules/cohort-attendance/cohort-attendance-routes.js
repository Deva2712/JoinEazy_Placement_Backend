import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { getAttendanceLogs } from "./cohort-attendance-controller.js";

const router = express.Router();

router.get("/attendance/logs/:cohortId", protect, getAttendanceLogs);

export default router;
