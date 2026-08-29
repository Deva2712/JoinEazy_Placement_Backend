// src/modules/students/profile-routes.js
//
// Two small routers mounted at /placement/profile and /placement/documents.
// Both act on the signed-in student, so neither takes an :id.
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import { upload, publicUrl } from "../../middleware/upload.middleware.js";
import { service } from "./profile-service.js";

export const profileRouter = express.Router();
profileRouter.use(protect);

profileRouter.get("/", asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.get(req.user.id) })));

profileRouter.patch("/", asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.update(req.user.id, req.body) })));

export const documentsRouter = express.Router();
documentsRouter.use(protect);

documentsRouter.get("/", asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.documents(req.user.id) })));

// Field names match the FormData keys the frontend appends: "resume" and
// "portfolio". A mismatch here makes multer ignore the file and the handler
// 400 with "No file uploaded", so they are not interchangeable.
documentsRouter.post("/resume", upload.single("resume"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, data: await service.setDocument(req.user.id, "resumeUrl", publicUrl(req.file.filename)) });
}));

documentsRouter.post("/portfolio", upload.single("portfolio"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, data: await service.setDocument(req.user.id, "projectUrl", publicUrl(req.file.filename)) });
}));
