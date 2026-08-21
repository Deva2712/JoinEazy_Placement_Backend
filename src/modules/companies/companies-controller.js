// src/modules/companies/companies-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./companies-service.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);
