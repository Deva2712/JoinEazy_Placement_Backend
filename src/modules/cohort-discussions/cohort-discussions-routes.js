import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as ctrl from "./cohort-discussions-controller.js";

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/",                                     ctrl.getDiscussions);
router.post("/",                                    ctrl.createDiscussion);
router.put("/:discussionId",                        ctrl.editDiscussion);
router.delete("/:discussionId",                     ctrl.deleteDiscussion);
router.post("/:discussionId/like",                  ctrl.likeDiscussion);
router.post("/:discussionId/replies",               ctrl.addReply);
router.put("/:discussionId/replies/:replyId",       ctrl.editReply);
router.delete("/:discussionId/replies/:replyId",    ctrl.deleteReply);
router.post("/:discussionId/replies/:replyId/like", ctrl.likeReply);

export default router;