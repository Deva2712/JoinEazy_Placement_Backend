import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./bulletins-controller.js";

const router = express.Router();
router.use(protect);

router.get("/", ctrl.list);
router.post("/", authorize(...PLACEMENT_STAFF), ctrl.create);
router.delete("/:bulletinId", authorize(...PLACEMENT_STAFF), ctrl.remove);

export default router;
