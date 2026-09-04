// src/modules/offers/offers-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController, ownerScopedList } from "../../utils/crud.js";
import { service } from "./offers-service.js";

const c = crudController(service);

// A student listing these sees only their own rows — see ownerScopedList.
export const list   = asyncHandler(ownerScopedList(service));
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);
