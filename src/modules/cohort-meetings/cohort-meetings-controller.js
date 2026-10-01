// src/modules/cohort-meetings/cohort-meetings-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-meetings-service.js";

export const getMeetings   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getMeetings(req.params.cohortId) }));
export const createMeeting = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createMeeting(req.params.cohortId, req.body, { id: req.user.id, name: req.user.name }) }));
export const updateMeeting = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateMeeting(req.params.cohortId, req.params.meetingId, req.body, req.user.id) }));
export const deleteMeeting = asyncHandler(async (req, res) => { await svc.deleteMeeting(req.params.cohortId, req.params.meetingId, req.user.id, req.user.role); res.json({ success: true, message: "Meeting deleted" }); });
// Student specific handlers
export const getStudentMeetings        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getStudentMeetings(req.params.cohortId, req.user.id) }));
export const getStudentMeetingRequests = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getStudentMeetingRequests(req.params.cohortId, req.user.id) }));
export const createMeetingRequest      = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createMeetingRequest(req.params.cohortId, req.user.id, req.body) }));
export const cancelMeetingRequest      = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.cancelMeetingRequest(req.params.cohortId, req.params.requestId, req.user.id) }));