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

/**
 * `branches[]=CSE&branches[]=IT` — Express's default query parser already turns
 * repeated `branches[]` keys into an array, but a single value arrives as a
 * bare string and `?branch=CSE` (the professor's single-branch variant) has to
 * work through the same helper. This normalises all three into a string[].
 *
 * The HOD service previously took a single `branch` while the frontend has
 * always sent `branches[]`, so every HOD read was unscoped.
 */
const branchesOf = (query) => {
  const raw = query["branches[]"] ?? query.branches ?? query.branch;
  if (raw == null || raw === "") return [];
  return (Array.isArray(raw) ? raw : [raw]).map(String).filter(Boolean);
};

export const pastPlacedStudents = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.pastPlacedStudents({ branches: branchesOf(req.query) }) }));

/** GET /placement/prof/overview?branch=CSE */
export const profOverview = asyncHandler(async (req, res) => {
  const branches = branchesOf(req.query);
  const [pastPlacedStudents, batchTotals] = await Promise.all([
    service.pastPlacedStudents({ branches }),
    service.batchTotals(),
  ]);
  res.json({ success: true, data: { pastPlacedStudents, batchTotals, branch: branches[0] ?? null } });
});

/** GET /placement/hod/overview?branches[]=CSE&branches[]=IT */
export const hodOverview = asyncHandler(async (req, res) => {
  const branches = branchesOf(req.query);
  const [pastPlacedStudents, batchTotals] = await Promise.all([
    service.pastPlacedStudents({ branches }),
    service.batchTotals(),
  ]);
  res.json({ success: true, data: { pastPlacedStudents, batchTotals, branches } });
});

/** GET /placement/{prof,hod}/active-drives — same handler, both mounts. */
export const activeDrives = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.activeDrives(branchesOf(req.query)) }));

/** GET /placement/hod/current-students — response is { students: [...] }. */
export const currentStudents = asyncHandler(async (req, res) =>
  res.json({ success: true, data: { students: await service.currentStudentsRoster(branchesOf(req.query)) } }));
