// src/modules/cohort-assignments/cohort-assignments-service.js
import { CohortAssignment, AssignmentSubmission } from "./cohort-assignments-model.js";

// GET /cohort/:cohortId/assignments
export const getAssignments = async (cohortId) => {
  const rows = await CohortAssignment.findAll({
    where: { cohort_id: String(cohortId) },
    include: [{ model: AssignmentSubmission, as: "submissions", attributes: ["id", "student_id", "grade", "submitted_at"] }],
    order: [["deadline", "ASC"]],
  });
  return { assignments: rows.map((a) => a.toJSON()) };
};

// POST /cohort/:cohortId/assignments
export const createAssignment = async (cohortId, body, userId) => {
  const assignment = await CohortAssignment.create({
    cohort_id:       String(cohortId),
    title:           body.name || body.title,
    description:     body.description || null,
    deadline:        body.deadline || null,
    marks:           body.marks || "10",
    type:            body.type || "individual",
    submission_link: body.submissionLink || null,
    created_by:      userId,
  });
  return assignment.toJSON();
};

// PUT /cohort/:cohortId/assignments/:assignmentId
export const updateAssignment = async (cohortId, assignmentId, body) => {
  const assignment = await CohortAssignment.findOne({ where: { id: assignmentId, cohort_id: String(cohortId) } });
  if (!assignment) { const e = new Error("Assignment not found"); e.statusCode = 404; throw e; }
  await assignment.update({
    title:           body.name || body.title || assignment.title,
    description:     body.description ?? assignment.description,
    deadline:        body.deadline ?? assignment.deadline,
    marks:           body.marks ?? assignment.marks,
    type:            body.type ?? assignment.type,
    submission_link: body.submissionLink ?? assignment.submission_link,
  });
  return assignment.toJSON();
};

// DELETE /cohort/:cohortId/assignments/:assignmentId
export const deleteAssignment = async (cohortId, assignmentId) => {
  const assignment = await CohortAssignment.findOne({ where: { id: assignmentId, cohort_id: String(cohortId) } });
  if (!assignment) { const e = new Error("Assignment not found"); e.statusCode = 404; throw e; }
  await assignment.destroy();
  return { deleted: true };
};

// POST /cohort/assignments/:assignmentId/grade
export const gradeSubmission = async (assignmentId, body) => {
  const submission = await AssignmentSubmission.findOne({ where: { id: body.submissionId, assignment_id: assignmentId } });
  if (!submission) { const e = new Error("Submission not found"); e.statusCode = 404; throw e; }
  await submission.update({ grade: body.grade });
  return submission.toJSON();
};

export const getSubmissionStatus = async (cohortId, userId, assignmentIds = null) => {
  const where = { student_id: userId };
  if (assignmentIds) where.assignment_id = assignmentIds;
  const subs = await AssignmentSubmission.findAll({ where, attributes: ["assignment_id","grade","marks_awarded","submitted_at"] });
  return { submissions: subs.map(s => s.toJSON()) };
};
export const getAssignmentSubmissions = async (cohortId, assignmentId) => {
  const submissions = await AssignmentSubmission.findAll({
    where: { assignment_id: assignmentId },
    order: [["submitted_at", "DESC"]],
  });
  return submissions.map((s) => s.toJSON());
};

export const submitAssignment = async (cohortId, assignmentId, student) => {
  const [submission, created] = await AssignmentSubmission.findOrCreate({
    where: { assignment_id: assignmentId, student_id: student.id },
    defaults: {
      student_name: student.name,
      submitted_at: new Date(),
    },
  });
  return { submission: submission.toJSON(), already_submitted: !created };
};

export const unsubmitAssignment = async (cohortId, assignmentId, studentId) => {
  const submission = await AssignmentSubmission.findOne({
    where: { assignment_id: assignmentId, student_id: studentId },
  });
  if (!submission) {
    const e = new Error("Submission not found");
    e.statusCode = 404;
    throw e;
  }
  await submission.destroy();
  return { deleted: true };
};