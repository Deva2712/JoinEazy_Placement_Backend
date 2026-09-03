import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./expenses-service.js";

export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list() }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.expenseId, req.body) }));
export const remove = asyncHandler(async (req, res) => res.json({ success: true, data: await service.remove(req.params.expenseId) }));
