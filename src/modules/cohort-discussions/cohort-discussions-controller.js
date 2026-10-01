import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-discussions-service.js";

const au = (req) => ({ id: req.user.id, name: req.user.name || req.user.email || "Placement Coordinator", avatar: req.user.avatar });

export const getDiscussions   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getDiscussions(req.params.cohortId, req.user.id) }));
export const createDiscussion = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createDiscussion(req.params.cohortId, req.body, au(req)) }));
export const editDiscussion   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.editDiscussion(req.params.cohortId, req.params.discussionId, req.body, req.user.id) }));
export const deleteDiscussion = asyncHandler(async (req, res) => { await svc.deleteDiscussion(req.params.cohortId, req.params.discussionId, req.user.id, req.user.role); res.json({ success: true, message: "Deleted" }); });
export const likeDiscussion   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.likeDiscussion(req.params.cohortId, req.params.discussionId, req.user.id) }));
export const addReply         = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.addReply(req.params.cohortId, req.params.discussionId, req.body, au(req)) }));
export const editReply        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.editReply(req.params.cohortId, req.params.discussionId, req.params.replyId, req.body, req.user.id) }));
export const deleteReply      = asyncHandler(async (req, res) => { await svc.deleteReply(req.params.cohortId, req.params.discussionId, req.params.replyId, req.user.id, req.user.role); res.json({ success: true, message: "Deleted" }); });
export const likeReply        = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.likeReply(req.params.cohortId, req.params.discussionId, req.params.replyId, req.user.id) }));
