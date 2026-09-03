import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./assets-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/list", ctrl.listAssets);
router.get("/requests", ctrl.requests);
router.post("/requests", ctrl.createRequest);
router.put("/requests/:requestId", ctrl.updateRequest);

export default router;
