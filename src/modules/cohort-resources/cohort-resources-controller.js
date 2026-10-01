// src/modules/cohort-resources/cohort-resources-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-resources-service.js";

export const getResources   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getResources(req.params.cohortId) }));
export const createWeek     = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createWeek(req.params.cohortId, req.body) }));
export const updateWeek     = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateWeek(req.params.cohortId, req.params.weekId, req.body) }));
export const deleteWeek     = asyncHandler(async (req, res) => { await svc.deleteWeek(req.params.cohortId, req.params.weekId); res.json({ success: true, message: "Week deleted" }); });
export const createResource = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createResource(req.params.cohortId, req.params.weekId, req.body) }));
export const updateResource = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateResource(req.params.cohortId, req.params.resourceId, req.body) }));
export const deleteResource = asyncHandler(async (req, res) => { await svc.deleteResource(req.params.cohortId, req.params.resourceId); res.json({ success: true, message: "Resource deleted" }); });