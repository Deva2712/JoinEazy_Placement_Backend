// src/modules/jobs/jobs-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./jobs-service.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);

export const openForStudent = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.openForStudent(req.query) }));

export const listRounds = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.listRounds(req.params.jobId) }));

export const addRound = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.addRound(req.params.jobId, req.body) }));

export const applicants = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.applicants(req.params.jobId) }));

export const recordOutcomes = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.recordRoundOutcomes(
    req.params.jobId, req.params.roundId, req.body.outcomes, req.user?.id) }));

export const revertOutcomes = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.revertRoundOutcomes(req.params.jobId, req.params.roundId) }));

export const advance = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.advance(req.params.jobId, req.body.status) }));
