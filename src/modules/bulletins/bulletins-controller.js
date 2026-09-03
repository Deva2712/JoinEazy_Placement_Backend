import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./bulletins-service.js";

export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(req.query) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body, req.user) }));
export const remove = asyncHandler(async (req, res) => res.json({ success: true, data: await service.remove(req.params.bulletinId) }));
