import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./leaves-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/applications", ctrl.applications);
router.post("/apply", ctrl.apply);
router.post("/update/:id", ctrl.update);
router.post("/approve/:id", ctrl.approve);
router.post("/substitutions/:id", ctrl.substitution);

export default router;
