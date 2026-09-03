import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./leaves-service.js";

export const applications = asyncHandler(async (req, res) => res.json({ success: true, data: await service.overview() }));
export const apply = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body) }));
export const approve = asyncHandler(async (req, res) => res.json({ success: true, data: await service.approve(req.params.id, req.body) }));
export const substitution = asyncHandler(async (req, res) => res.json({ success: true, data: await service.substitution(req.params.id, req.body) }));
