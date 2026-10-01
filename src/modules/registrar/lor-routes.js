import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./registrar-service.js";

const router = express.Router();

router.get("/requests",                          protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getLorRequests(req.user.id) });
}));

router.post("/requests",                         protect, asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createLorRequest(req.user.id, req.body) });
}));

router.delete("/requests/:requestId",            protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.cancelLorRequest(req.params.requestId, req.user.id) });
}));

router.post("/requests/:lorRequestId/meeting",   protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.scheduleLorMeeting(req.params.lorRequestId, req.user.id, req.body.meetingTime) });
}));

export default router;