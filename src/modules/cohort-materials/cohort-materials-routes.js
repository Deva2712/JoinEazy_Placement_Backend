import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-materials-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/",              ctrl.getMaterials);
router.post("/",             ctrl.createMaterial);
router.put("/:materialId",   ctrl.updateMaterial);
router.delete("/:materialId",ctrl.deleteMaterial);

export default router;