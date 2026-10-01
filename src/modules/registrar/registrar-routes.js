import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./registrar-service.js";

const router = express.Router();

router.get("/overview",               protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getOverview(req.user.id) });
}));

router.get("/requests",               protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getRequests(req.user.id) });
}));

router.post("/requests",              protect, asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createRequest(req.user.id, req.body) });
}));

router.delete("/requests/:requestId", protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.cancelRequest(req.params.requestId, req.user.id) });
}));

router.get("/lor",                    protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.getLorRequests(req.user.id) });
}));

router.post("/lor",                   protect, asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await svc.createLorRequest(req.user.id, req.body) });
}));

router.delete("/lor/:requestId",      protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.cancelLorRequest(req.params.requestId, req.user.id) });
}));

export default router;