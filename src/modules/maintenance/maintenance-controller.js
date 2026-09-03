import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./maintenance-service.js";

export const myRequests = asyncHandler(async (req, res) => res.json({ success: true, data: await service.overview() }));
export const createRequest = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) }));
export const updateStatus = asyncHandler(async (req, res) => res.json({ success: true, data: await service.updateStatus(req.params.requestId, req.body) }));
