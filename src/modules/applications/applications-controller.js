// src/modules/applications/applications-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./applications-service.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const remove = asyncHandler(c.remove);

export const mine = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.forStudent(req.user.id) }));

export const apply = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.apply(req.params.jobId, {
    id: req.user.id, name: req.user.name, resumeUrl: req.body?.resumeUrl,
  }) }));

export const setStatus = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.setStatus(req.params.id, req.body.status, req.body) }));

export const setStatusBulk = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.setStatusBulk(req.body.ids, req.body.status) }));

export const roundResults = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.roundResults(req.params.jobId, req.query.roundId) }));
