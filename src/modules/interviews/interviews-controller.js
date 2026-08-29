// src/modules/interviews/interviews-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./interviews-service.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);

/** POST /batch — body { slots: [...] }, one request for a whole cohort. */
export const createBatch = asyncHandler(async (req, res) => {
  const slots = Array.isArray(req.body) ? req.body : req.body?.slots;
  res.status(201).json({ success: true, data: await service.createBatch(slots) });
});
