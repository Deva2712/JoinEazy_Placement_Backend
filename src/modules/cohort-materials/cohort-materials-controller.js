import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-materials-service.js";

export const getMaterials   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getMaterials(req.params.cohortId) }));
export const createMaterial = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createMaterial(req.params.cohortId, req.body, req.user.id) }));
export const updateMaterial = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateMaterial(req.params.cohortId, req.params.materialId, req.body, req.user.id) }));
export const deleteMaterial = asyncHandler(async (req, res) => { await svc.deleteMaterial(req.params.cohortId, req.params.materialId, req.user.id); res.json({ success: true, message: "Deleted" }); });