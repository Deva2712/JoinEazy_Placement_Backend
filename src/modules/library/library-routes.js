// src/modules/library/library-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./library-controller.js";

const router = express.Router();
router.use(protect);

router.get("/dashboard",                    ctrl.getLibraryDashboard);  // GET  /library/dashboard
router.post("/request",                     ctrl.requestBook);           // POST /library/request
router.delete("/requests/:requestId",       ctrl.cancelRequest);         // DELETE /library/requests/:id
router.post("/return",                      ctrl.returnBook);            // POST /library/return
router.post("/extend",                      ctrl.requestExtension);      // POST /library/extend
router.post("/approve-extension",           ctrl.approveExtension);      // POST /library/approve-extension

export default router;