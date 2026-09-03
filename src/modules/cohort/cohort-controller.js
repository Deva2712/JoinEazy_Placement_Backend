import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./cohort-service.js";

export const announcements = asyncHandler(async (req, res) => res.json({ success: true, data: await service.announcements(req.params.cohortId) }));
export const createAnnouncement = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createAnnouncement(req.params.cohortId, req.body, req.user) }));
