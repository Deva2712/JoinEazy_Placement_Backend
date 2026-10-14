// src/modules/jobs/jobs-service.js
//
// Drives (a.k.a. jobs) and their selection rounds. This is the module with the
// most real behaviour in the skeleton, because the drive lifecycle is what the
// coordinator UI is built around.
import { Op } from "sequelize";
import { Job, DriveRound } from "./jobs-model.js";
import { Company } from "../companies/companies-model.js";
import { Application, RoundResult } from "../applications/applications-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { AssessmentTest } from "../assessments/assessments-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(Job, {
  include: [
    { model: Company, as: "companyRef", attributes: ["id", "name", "sector", "tier"] },
    { model: DriveRound, as: "selectionRounds" },
  ],
  order: [["postedAt", "DESC"]],
});

// ─── Drive shape translation ──────────────────────────────────────────────────
// The frontend's drive object (MOCK_PLACEMENT_JOBS / JobOpeningModal) names a
// few things differently from the columns. Rather than rename columns that the
// rest of the backend already reads, reads emit the frontend's names alongside
// the canonical ones and writes accept either.
//
//   company  ↔ companyName        cgpa ("7.5+") ↔ minCgpa (7.5)
//   selectionRounds[{order,label,…}] ↔ DriveRound rows
//
// Assessment fields (assessmentLink/Deadline/DurationMins/Instructions) are
// stored on AssessmentTest — the Phase 4c decision to keep them off this
// already-large model — but the frontend reads them straight off the drive
// (uploadAssessmentResults gates on `job.assessmentLink`), so they are merged in
// on read here rather than duplicated as columns.

/** 7.5 → "7.5+"; the modal parses the number back out of this string. */
const cgpaDisplay = (n) => (n == null ? null : `${n}+`);
/** "7.5+" / "7.5" / 7.5 → 7.5 */
const cgpaValue = (raw) => {
  if (raw == null || raw === "") return null;
  const n = parseFloat(String(raw));
  return Number.isNaN(n) ? null : n;
};

const roundToApi = (r) => ({
  id: r.id,
  order: r.sequence,
  type: r.type,
  label: r.name,
  format: r.format,
  category: r.category,
  config: r.config || {},
  scheduledAt: r.scheduledAt ?? null,
  status: r.status,
});

const toApi = (job, assessment = null) => ({
  ...job,
  company: job.companyName ?? job.companyRef?.name ?? null,
  cgpa: cgpaDisplay(job.minCgpa),
  selectionRounds: (job.selectionRounds || [])
    .slice()
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map(roundToApi),
  assessmentLink:         assessment?.url ?? null,
  assessmentDeadline:     assessment?.scheduled_at ?? null,
  assessmentDurationMins: assessment?.duration_mins ?? null,
  assessmentInstructions: assessment?.instructions ?? null,
});

/** One query for every job's assessment row, keyed by job id. */
const assessmentsFor = async (jobIds) => {
  if (!jobIds.length) return {};
  const tests = await AssessmentTest.findAll({ where: { job_id: jobIds }, raw: true });
  return Object.fromEntries(tests.map((t) => [t.job_id, t]));
};

const resolveStudentKey = async (studentId) => {
  if (!studentId) return null;
  const raw = String(studentId);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
  const roster = isUuid
    ? await PlacementStudent.findOne({ where: { userId: raw } })
    : await PlacementStudent.findOne({ where: { rollNo: raw } });
  return roster?.userId ?? raw;
};

/** Strip the frontend-only aliases and fold them into real columns. */
const fromApi = (data = {}) => {
  const { company, cgpa, selectionRounds, ...rest } = data;
  return {
    attrs: {
      ...rest,
      ...(company !== undefined && rest.companyName === undefined ? { companyName: company } : {}),
      ...(cgpa !== undefined && rest.minCgpa === undefined ? { minCgpa: cgpaValue(cgpa) } : {}),
    },
    selectionRounds: Array.isArray(selectionRounds) ? selectionRounds : null,
  };
};

/**
 * Replace a drive's rounds with the submitted set. The modal always sends the
 * complete list, so a full re-sync is what "save" means here; rounds absent from
 * the payload were deleted by the coordinator.
 */
const syncRounds = async (jobId, rounds) => {
  if (!rounds) return;
  const keep = rounds.filter((r) => r.id).map((r) => r.id);
  await DriveRound.destroy({
    where: { jobId, ...(keep.length ? { id: { [Op.notIn]: keep } } : {}) },
  });
  for (const [i, r] of rounds.entries()) {
    const attrs = {
      jobId,
      name: (r.label || r.name || "Round").trim(),
      type: r.type || null,
      sequence: r.order ?? i + 1,
      format: r.format || null,
      category: r.category || null,
      config: r.config || {},
    };
    const existing = r.id ? await DriveRound.findOne({ where: { id: r.id, jobId } }) : null;
    if (existing) await existing.update(attrs);
    else await DriveRound.create(attrs);
  }
};

export const service = {
  ...base,

  list: async (query) => {
    const rows = await base.list(query);
    const byJob = await assessmentsFor(rows.map((r) => r.id));
    return rows.map((r) => toApi(r, byJob[r.id]));
  },

  get: async (id) => {
    const row = await base.get(id);
    const byJob = await assessmentsFor([row.id]);
    return toApi(row, byJob[row.id]);
  },

  create: async (data) => {
    const { attrs, selectionRounds } = fromApi(data);
    const row = await Job.create(attrs);
    await syncRounds(row.id, selectionRounds);
    return service.get(row.id);
  },

  update: async (id, data) => {
    const row = await Job.findByPk(id);
    if (!row) notFound("Drive not found");
    const { attrs, selectionRounds } = fromApi(data);
    await row.update(attrs);
    await syncRounds(id, selectionRounds);
    return service.get(id);
  },

  /** Drives a student may apply to: open, undeadlined, and matching eligibility. */
  openForStudent: async (student = {}) => {
    const rows = await Job.findAll({
      where: {
        status: "Applications open",
        [Op.or]: [{ deadline: null }, { deadline: { [Op.gt]: new Date() } }],
      },
      include: [{ model: Company, as: "companyRef", attributes: ["id", "name", "sector"] }],
      order: [["deadline", "ASC"]],
    });
    return rows
      .map((r) => r.toJSON())
      .filter((j) => {
        if (j.minCgpa != null && student.cgpa != null && student.cgpa < j.minCgpa) return false;
        if (Array.isArray(j.branches) && j.branches.length && student.branch) {
          return j.branches.includes(student.branch);
        }
        return true;
      });
  },


  /**
   * POST /placement/drives/:jobId/applicants — bulk-add applicants to a drive
   * from a CSV the coordinator uploaded (applicantsSpec).
   *
   * rows: [{ rollNo, name, branch, cgpa, status }]
   * Returns { added, skipped } — the exact keys the spec's apply() reads.
   *
   * Roll numbers are resolved against the roster; a student already on this
   * drive is skipped rather than duplicated (there is a unique index on
   * job_id + student_id, so inserting anyway would abort the whole batch).
   */
  importApplicants: async (jobId, rows = []) => {
    const job = await Job.findByPk(jobId);
    if (!job) notFound("Drive not found");
    if (!Array.isArray(rows)) badRequest("Expected { rows: [...] }");

    let added = 0;
    const skipped = [];
    for (const row of rows) {
      const rollNo = String(row?.rollNo || "").trim();
      if (!rollNo) { skipped.push({ rollNo: null, reason: "Missing rollNo" }); continue; }

      const roster = await PlacementStudent.findOne({ where: { rollNo } });
      if (!roster) { skipped.push({ rollNo, reason: "Unknown rollNo — not on the roster" }); continue; }

      const existing = await Application.findOne({ where: { jobId, studentId: roster.userId } });
      if (existing) { skipped.push({ rollNo, reason: "Already applied to this drive" }); continue; }

      await Application.create({
        jobId,
        studentId: roster.userId,
        studentName: row.name || roster.name,
        studentRoll: rollNo,
        status: row.status || "Applied",
      });
      added += 1;
    }
    return { added, skipped: skipped.length, skippedRows: skipped };
  },

  listRounds: async (jobId) => {
    const rows = await DriveRound.findAll({ where: { jobId: jobId }, order: [["sequence", "ASC"]] });
    return rows.map((r) => r.toJSON());
  },

  addRound: async (jobId, data) => {
    const job = await Job.findByPk(jobId);
    if (!job) notFound("Drive not found");
    const count = await DriveRound.count({ where: { jobId: jobId } });
    const round = await DriveRound.create({
      jobId: jobId,
      name: data.name,
      type: data.type || null,
      sequence: data.sequence ?? count + 1,
      scheduledAt: data.scheduledAt || data.scheduled_at || null,
    });
    return round.toJSON();
  },

  applicants: async (jobId) => {
    const rows = await Application.findAll({ where: { jobId: jobId }, order: [["appliedAt", "ASC"]] });
    return rows.map((r) => r.toJSON());
  },

  /**
   * Record outcomes for one round in bulk.
   * outcomes: [{ studentId, status, score, notes }]
   * Cleared students advance; rejected ones end here.
   */
  recordRoundOutcomes: async (jobId, roundId, outcomes = [], userId = null) => {
    if (!Array.isArray(outcomes) || !outcomes.length) badRequest("No outcomes supplied");
    const round = await DriveRound.findOne({ where: { id: roundId, jobId: jobId } });
    if (!round) notFound("Round not found for this drive");

    const written = [];
    for (const o of outcomes) {
      const studentId = await resolveStudentKey(o.studentId);
      const [row] = await RoundResult.findOrCreate({
        where: { roundId: roundId, studentId },
        defaults: {
          jobId: jobId, roundId: roundId, studentId,
          applicationId: o.applicationId || null,
        },
      });
      await row.update({
        status: o.status || "Pending",
        score: o.score ?? null,
        notes: o.notes || null,
        recordedBy: userId,
        recordedAt: new Date(),
      });
      written.push(row.toJSON());

      // Keep the application's status in step with the round outcome.
      const app = o.applicationId
        ? await Application.findByPk(o.applicationId)
        : await Application.findOne({ where: { jobId: jobId, studentId } });
      if (app) {
        if (o.status === "Rejected") await app.update({ status: "Rejected" });
        else if (o.status === "Cleared") await app.update({ currentRound: round.sequence });
      }
    }
    return { written: written.length, results: written };
  },

  /** Undo a round's recorded outcomes — the UI offers this as "revert". */
  revertRoundOutcomes: async (jobId, roundId) => {
    const removed = await RoundResult.destroy({ where: { jobId: jobId, roundId: roundId } });
    return { reverted: removed };
  },

  /** Move the drive to its next lifecycle stage. */
  advance: async (jobId, nextStatus) => {
    const job = await Job.findByPk(jobId);
    if (!job) notFound("Drive not found");
    const ORDER = ["Applications open", "Assessment", "Interviews", "Offered", "Drive complete"];
    const next = nextStatus || ORDER[Math.min(ORDER.indexOf(job.status) + 1, ORDER.length - 1)];
    await job.update({ status: next });
    return job.toJSON();
  },
};
