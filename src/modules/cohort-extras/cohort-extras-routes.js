import express from "express";
import { protect, authorize, PLACEMENT_STAFF } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-extras-controller.js";

const router = express.Router();
const staff = authorize(...PLACEMENT_STAFF);

router.get("/archived", protect, ctrl.getArchivedCohorts);
router.post("/group/accept-invite", protect, ctrl.acceptGroupInvite);
router.delete("/group/:groupId/remove-member", protect, ctrl.removeGroupMember);
router.post("/group/:groupId/add-members", protect, ctrl.addMembersToGroup);
router.get("/cohorts/:cohortId/grades", protect, ctrl.getGrades);

router.get("/:cohortId/details", protect, ctrl.getCohortDetails);
router.get("/:cohortId", protect, ctrl.getCohortById);
router.post("/:cohortId/archive", protect, staff, ctrl.getCohortById);

router.post("/:cohortId/invitation-link", protect, staff, ctrl.generateInvitationLink);
router.get("/:cohortId/invitation-status", protect, ctrl.getInvitationStatus);

router.post("/:cohortId/details/add", protect, staff, ctrl.addDetailSection);
router.patch("/:cohortId/details/:detailId/edit", protect, staff, ctrl.editDetailSection);
router.delete("/:cohortId/details/:detailId", protect, staff, ctrl.deleteDetailSection);

router.post("/:cohortId/group/create", protect, ctrl.createGroup);
router.put("/:cohortId/group/:groupId/edit", protect, ctrl.updateGroup);
router.delete("/:cohortId/group/:groupId/delete", protect, ctrl.deleteGroup);
router.get("/:cohortId/group/:groupId/details", protect, ctrl.getGroupDetails);
router.get("/:cohortId/available-members/:groupId", protect, ctrl.getAvailableMembers);

router.post("/:cohortId/invite", protect, staff, ctrl.uploadParticipants);
router.delete("/:cohortId/participants/remove", protect, staff, ctrl.removeParticipant);
router.get("/:cohortId/members", protect, ctrl.getCohortMembers);

router.get("/:cohortId/leaderboard", protect, ctrl.getLeaderboard);
router.get("/:cohortId/leaderboard/individuals", protect, ctrl.getIndividualLeaderboard);
router.get("/:cohortId/leaderboard/groups", protect, ctrl.getGroupLeaderboard);

router.post("/:cohortId/submission", protect, ctrl.submitCourseWork);
router.get("/:cohortId/submission", protect, ctrl.getSubmission);
router.put("/:cohortId/submission", protect, ctrl.updateSubmission);
router.delete("/:cohortId/submission", protect, ctrl.deleteSubmission);
router.post("/:cohortId/projects/upload", protect, staff, ctrl.uploadProjects);

export default router;
