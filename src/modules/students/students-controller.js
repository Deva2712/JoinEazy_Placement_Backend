// src/modules/students/students-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./students-service.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);

/** POST /bulk — body is a bare array of roster rows (CSV import pipeline). */
export const createBulk = asyncHandler(async (req, res) => {
  const payloads = Array.isArray(req.body) ? req.body : req.body?.students;
  res.status(201).json({ success: true, data: await service.createBulk(payloads) });
});
