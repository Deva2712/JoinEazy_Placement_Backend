// src/modules/companies/companies-routes.js
import express from "express";
import { protect, authorize, COORD_ONLY } from "../../middleware/auth.middleware.js";
import * as ctrl from "./companies-controller.js";

const router = express.Router();
router.use(protect);

// Reads are open to any authenticated user; writes are the coordinator only.
router.get("/",        ctrl.list);
router.get("/:id",     ctrl.get);
router.post("/",       authorize(...COORD_ONLY), ctrl.create);
router.put("/:id",     authorize(...COORD_ONLY), ctrl.update);
router.delete("/:id",  authorize(...COORD_ONLY), ctrl.remove);

export default router;
