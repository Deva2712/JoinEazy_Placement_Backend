import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./payroll-service.js";

export const history = asyncHandler(async (req, res) => res.json({ success: true, data: await service.history() }));
export const breakdown = asyncHandler(async (req, res) => res.json({ success: true, data: await service.breakdown() }));
export const download = asyncHandler(async (req, res) => res.json({ success: true, data: await service.download(req.params.id) }));
