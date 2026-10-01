import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-meetings-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

// Student routes — frontend calls these
router.get("/student/meetings",                               ctrl.getStudentMeetings);
router.get("/student/meeting-requests",                       ctrl.getStudentMeetingRequests);
router.post("/student/meeting-requests",                      ctrl.createMeetingRequest);
router.delete("/student/meeting-requests/:requestId",         ctrl.cancelMeetingRequest);

// Legacy CRUD
router.get("/",              ctrl.getMeetings);
router.post("/",             ctrl.createMeeting);
router.put("/:meetingId",    ctrl.updateMeeting);
router.delete("/:meetingId", ctrl.deleteMeeting);

export default router;