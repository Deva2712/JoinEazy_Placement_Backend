// src/modules/overview/overview-controller.js
//
// `req.scope` is set by the branchScope middleware and is the ONLY source of
// branch filtering — controllers never read req.query.branch themselves, or the
// scoping the middleware enforces would be trivially bypassed.
import { asyncHandler } from "../../middleware/error.middleware.js";
import { service } from "./overview-service.js";

export const student = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.student(req.user.id) }));

export const coordinator = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.coordinator() }));

// Shared by /prof/overview and /hod/overview — same query, different scope.
export const branchOverview = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.branchOverview(req.scope) }));

export const activeDrives = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.activeDrives(req.scope) }));

export const currentStudents = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.currentStudents(req.scope) }));

export const pastPlaced = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.pastPlaced(req.scope) }));

export const batchTotals = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.batchTotals(req.scope) }));
