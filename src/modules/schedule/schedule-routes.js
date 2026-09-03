import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./schedule-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/schedule", ctrl.overview);
router.put("/schedule", ctrl.update);
router.post("/meetings", ctrl.createMeeting);
router.post("/meetings/:requestId/accept", ctrl.accept);
router.post("/meetings/:requestId/reject", ctrl.reject);
router.post("/meetings/:requestId/reschedule", ctrl.reschedule);

export default router;
