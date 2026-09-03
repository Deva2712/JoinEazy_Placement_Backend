import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./advances-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/list", ctrl.list);
router.post("/create", ctrl.create);
router.patch("/:advanceId/update", ctrl.update);
router.delete("/:advanceId", ctrl.remove);

export default router;
