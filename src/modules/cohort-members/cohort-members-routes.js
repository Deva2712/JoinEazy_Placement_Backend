// src/modules/cohort-members/cohort-members-routes.js
import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-members-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/",           ctrl.getMembers);                                   // GET    /cohort/:cohortId/members?limit=2000&page=1
router.post("/",          authorize(...PLACEMENT_STAFF), ctrl.addMember);   // POST
router.delete("/:userId", authorize(...PLACEMENT_STAFF), ctrl.removeMember);// DELETE /cohort/:cohortId/members/:userId
router.delete("/participants/remove", authorize(...PLACEMENT_STAFF), ctrl.removeMember); // DELETE /cohort/:cohortId/members/participants/remove  (with body { userIds: [] })
export default router;
