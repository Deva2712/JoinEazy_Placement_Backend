// src/modules/offers/offers-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./offers-service.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);

/**
 * PATCH /:id/status — the frontend's updateOfferStatus() sends only { status }.
 * Kept separate from the generic update so a status change can never carry an
 * unrelated field patch in the same request.
 */
export const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: "status is required" });
  }
  res.json({ success: true, data: await service.update(req.params.id, { status }) });
});

/** POST /bulk — body is a bare array of offer payloads (CSV import pipeline). */
export const createBulk = asyncHandler(async (req, res) => {
  const payloads = Array.isArray(req.body) ? req.body : req.body?.offers;
  res.status(201).json({ success: true, data: await service.createBulk(payloads) });
});
