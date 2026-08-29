// src/modules/jobs/jobs-controller.js
import { asyncHandler } from "../../middleware/error.middleware.js";
import { crudController } from "../../utils/crud.js";
import { service } from "./jobs-service.js";
import { InterviewSlot } from "../interviews/interviews-model.js";
import { RoundResult } from "../applications/applications-model.js";
import { AssessmentTest, AssessmentScore } from "../assessments/assessments-model.js";
import { Application } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";

const c = crudController(service);

export const list   = asyncHandler(c.list);
export const get    = asyncHandler(c.get);
export const create = asyncHandler(c.create);
export const update = asyncHandler(c.update);
export const remove = asyncHandler(c.remove);

export const openForStudent = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.openForStudent(req.query) }));

export const listRounds = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.listRounds(req.params.jobId) }));

export const addRound = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.addRound(req.params.jobId, req.body) }));

export const applicants = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.applicants(req.params.jobId) }));

export const recordOutcomes = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.recordRoundOutcomes(
    req.params.jobId, req.params.roundId, req.body.outcomes, req.user?.id) }));

export const revertOutcomes = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.revertRoundOutcomes(req.params.jobId, req.params.roundId) }));

export const advance = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.advance(req.params.jobId, req.body.status) }));

export const interviewsForJob = asyncHandler(async (req, res) => {
  const rows = await InterviewSlot.findAll({
    where: { jobId: req.params.jobId },
    order: [["scheduledAt", "ASC"]],
  });
  res.json({ success: true, data: rows.map((r) => r.toJSON()) });
});

export const roundResults = asyncHandler(async (req, res) => {
  const where = { jobId: req.params.jobId };
  if (req.query.roundId) where.roundId = req.query.roundId;
  const rows = await RoundResult.findAll({ where, order: [["recordedAt", "DESC"]] });
  res.json({ success: true, data: rows.map((r) => r.toJSON()) });
});

export const publishAssessment = asyncHandler(async (req, res) => {
  const [test] = await AssessmentTest.findOrCreate({
    where: { job_id: req.params.jobId },
    defaults: { job_id: req.params.jobId, title: "Assessment" },
  });
  await test.update({
    url: req.body.link || req.body.assessmentLink || test.url,
    scheduled_at: req.body.deadline || req.body.assessmentDeadline || test.scheduled_at,
    duration_mins: req.body.durationMins || req.body.assessmentDurationMins || test.duration_mins,
    instructions: req.body.instructions || req.body.assessmentInstructions || test.instructions,
    status: "Scheduled",
  });
  res.json({ success: true, data: test.toJSON() });
});

export const getAssessmentResults = asyncHandler(async (req, res) => {
  const test = await AssessmentTest.findOne({ where: { job_id: req.params.jobId } });
  if (!test) return res.json({ success: true, data: [] });
  const scores = await AssessmentScore.findAll({ where: { test_id: test.id }, raw: true });
  // The Results tab and the student's own lookup read { jobId, studentId (a
  // roll number), cleared, submittedAt, notes } — not raw score rows.
  const roster = await PlacementStudent.findAll({
    where: { id: scores.map((s) => s.student_id) },
    attributes: ["id", "rollNo"], raw: true,
  });
  const rollById = Object.fromEntries(roster.map((r) => [r.id, r.rollNo]));
  res.json({
    success: true,
    data: scores.map((s) => ({
      id: s.id,
      jobId: req.params.jobId,
      studentId: rollById[s.student_id] ?? s.student_id,
      cleared: s.result === "Cleared",
      submittedAt: s.attempted_at,
      notes: s.notes ?? "",
    })),
  });
});

/**
 * Applications this drive's assessment applies to: Shortlisted (yet to sit it)
 * plus Test Cleared / Rejected (already through it). The skeleton returned only
 * Shortlisted, so the Results tab lost every row as soon as it was uploaded.
 */
export const getShortlistedForJob = asyncHandler(async (req, res) => {
  const rows = await Application.findAll({
    where: { jobId: req.params.jobId, status: ["Shortlisted", "Test Cleared", "Rejected"] },
  });
  res.json({ success: true, data: rows.map((r) => r.toJSON()) });
});

/** pass/fail token → boolean; null when unrecognised (the row is then skipped). */
const parseResultToken = (raw) => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (["pass", "passed", "cleared", "clear", "p", "yes", "y", "true", "1"].includes(s)) return true;
  if (["fail", "failed", "rejected", "reject", "not cleared", "notcleared", "no", "n", "false", "0", "f"].includes(s)) return false;
  return null;
};

/**
 * POST /placement/jobs/:jobId/assessment/results — bulk-upsert results.
 *
 * Rows are [{ rollNo, result, notes? }]: companies report pass/fail only, not
 * numeric scores, so there is no cutoff arithmetic here. Each accepted row also
 * transitions its application (cleared → "Test Cleared", otherwise "Rejected");
 * students absent from the CSV keep their status, which is the documented
 * policy — the coordinator follows those up by hand.
 *
 * The response carries per-transition counts because the upload modal reports
 * "moved N to Test Cleared, M to Rejected" alongside created/updated/skipped.
 */
export const uploadAssessmentResults = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  const test = await AssessmentTest.findOne({ where: { job_id: jobId } });
  if (!test || !test.url) {
    return res.status(400).json({ success: false, message: "Publish the assessment before uploading results." });
  }
  if (!rows.length) {
    return res.status(400).json({ success: false, message: "No rows to import" });
  }

  const created = [];
  const updated = [];
  const skipped = [];
  let clearedCount = 0;
  let rejectedCount = 0;

  for (const row of rows) {
    const rollNo = String(row?.rollNo || "").trim();
    if (!rollNo) { skipped.push({ rollNo, reason: "Missing rollNo" }); continue; }

    const roster = await PlacementStudent.findOne({ where: { rollNo } });
    if (!roster) { skipped.push({ rollNo, reason: "Unknown rollNo — no matching student" }); continue; }

    const app = await Application.findOne({ where: { jobId, studentId: roster.id } });
    if (!app) { skipped.push({ rollNo, reason: "Student hasn't applied to this job" }); continue; }
    if (!["Shortlisted", "Test Cleared", "Rejected"].includes(app.status)) {
      skipped.push({ rollNo, reason: `Application at status "${app.status}" — must be Shortlisted or already through the assessment stage` });
      continue;
    }

    const cleared = parseResultToken(row?.result);
    if (cleared == null) {
      skipped.push({ rollNo, reason: "Result must be pass/fail (e.g. pass, fail, cleared, rejected)" });
      continue;
    }

    const notes = typeof row?.notes === "string" ? row.notes.trim() : "";
    const [score, wasCreated] = await AssessmentScore.findOrCreate({
      where: { test_id: test.id, student_id: roster.id },
      defaults: { test_id: test.id, student_id: roster.id },
    });
    await score.update({
      result: cleared ? "Cleared" : "Not cleared",
      notes,
      attempted_at: new Date(),
    });

    const entry = { id: score.id, jobId, studentId: rollNo, cleared, submittedAt: score.attempted_at, notes };
    (wasCreated ? created : updated).push(entry);

    const nextStatus = cleared ? "Test Cleared" : "Rejected";
    if (app.status !== nextStatus) await app.update({ status: nextStatus });
    if (cleared) clearedCount += 1; else rejectedCount += 1;
  }

  res.json({
    success: true,
    data: {
      created, updated, skipped,
      transitioned: { cleared: clearedCount, rejected: rejectedCount },
      summary: {
        createdCount: created.length,
        updatedCount: updated.length,
        skippedCount: skipped.length,
        totalRows: rows.length,
      },
    },
  });
});

/** POST /:jobId/applicants — CSV applicant import. */
export const importApplicants = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.importApplicants(req.params.jobId, req.body?.rows) }));
