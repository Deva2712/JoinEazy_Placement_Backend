// src/modules/interviews/interviews-routes.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./interviews-controller.js";

const router = express.Router();
router.use(protect);

// Reads are open to any authenticated user; writes are placement staff.
router.get("/",        ctrl.list);
router.get("/:id",     ctrl.get);
router.post("/",       authorize(...PLACEMENT_STAFF), ctrl.create);
// Literal path before the parameterised one, or "/batch" is read as an :id.
router.post("/batch",  authorize(...PLACEMENT_STAFF), ctrl.createBatch);
router.patch("/:id",     authorize(...PLACEMENT_STAFF), ctrl.update);
router.delete("/:id",  authorize(...PLACEMENT_STAFF), ctrl.remove);

export default router;
