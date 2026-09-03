import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./assets-service.js";

export const listAssets = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listAssets() }));
export const requests = asyncHandler(async (req, res) => res.json({ success: true, data: await service.requests() }));
export const createRequest = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createRequest(req.body) }));
export const updateRequest = asyncHandler(async (req, res) => res.json({ success: true, data: await service.updateRequest(req.params.requestId, req.body) }));
