// src/modules/overview/overview-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./overview-service.js";

export const student = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.student(req.user.id) }));

export const coordinator = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.coordinator() }));

export const hod = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.hod({
    branch: req.query.branch, batchYear: req.query.batchYear,
  }) }));

export const batchTotals = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.batchTotals() }));
