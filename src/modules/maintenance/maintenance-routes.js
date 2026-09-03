import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./maintenance-controller.js";

const router = express.Router();
router.use(protect);
router.use(authorize(...PLACEMENT_STAFF));

router.get("/my-requests", ctrl.myRequests);
router.post("/requests", ctrl.createRequest);
router.patch("/requests/:requestId/status", ctrl.updateStatus);

export default router;
