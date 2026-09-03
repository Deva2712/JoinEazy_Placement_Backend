import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./schedule-service.js";

export const overview = asyncHandler(async (req, res) => res.json({ success: true, data: await service.overview() }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.updateSchedule(req.body) }));
export const createMeeting = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createMeeting(req.body) }));
export const accept = asyncHandler(async (req, res) => res.json({ success: true, data: await service.accept(req.params.requestId, req.body) }));
export const reject = asyncHandler(async (req, res) => res.json({ success: true, data: await service.reject(req.params.requestId, req.body) }));
export const reschedule = asyncHandler(async (req, res) => res.json({ success: true, data: await service.reschedule(req.params.requestId, req.body) }));
