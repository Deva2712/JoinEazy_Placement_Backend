// src/modules/cohort-assignments/cohort-assignments-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import * as svc from "./cohort-assignments-service.js";

export const getAssignments   = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.getAssignments(req.params.cohortId) }));
export const createAssignment = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await svc.createAssignment(req.params.cohortId, req.body, req.user.id) }));
export const updateAssignment = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.updateAssignment(req.params.cohortId, req.params.assignmentId, req.body) }));
export const deleteAssignment = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.deleteAssignment(req.params.cohortId, req.params.assignmentId) }));
export const gradeSubmission  = asyncHandler(async (req, res) => res.json({ success: true, data: await svc.gradeSubmission(req.params.assignmentId, req.body) }));
export const getSubmissionStatus = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const { assignmentIds } = req.query;
  const ids = assignmentIds ? assignmentIds.split(",") : null;
  const data = await svc.getSubmissionStatus(cohortId, req.user?.id, ids);
  res.json({ success: true, data });
});

export const gradeGroupAssignment = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await svc.gradeAssignment(req.params.assignmentId, req.body) });
});
export const getSubmissions = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  const data = await svc.getAssignmentSubmissions(cohortId, assignmentId);
  res.json({ success: true, data });
});

export const markSubmitted = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  const student = { id: req.user.id, name: req.user.name };
  const data = await svc.submitAssignment(cohortId, assignmentId, student);
  res.json({ success: true, data });
});

export const unmarkSubmitted = asyncHandler(async (req, res) => {
  const { cohortId, assignmentId } = req.params;
  await svc.unsubmitAssignment(cohortId, assignmentId, req.user.id);
  res.json({ success: true, message: "Submission removed" });
});