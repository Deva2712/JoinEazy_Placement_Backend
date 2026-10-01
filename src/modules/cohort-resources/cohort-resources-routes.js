// src/modules/cohort-resources/cohort-resources-routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-resources-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/",                   ctrl.getResources);   // GET  /cohort/:cohortId/resources
router.post("/week",              ctrl.createWeek);     // POST /resources/week
router.put("/week/:weekId",       ctrl.updateWeek);     // PUT  /resources/week/:weekId
router.delete("/week/:weekId",    ctrl.deleteWeek);     // DELETE
router.post("/week/:weekId",      ctrl.createResource); // POST /resources/week/:weekId (add resource to week)
router.put("/:resourceId",        ctrl.updateResource); // PUT  /resources/:resourceId
router.delete("/:resourceId",     ctrl.deleteResource); // DELETE

export default router;