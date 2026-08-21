// src/modules/jobs/jobs-service.js
//
// Drives (a.k.a. jobs) and their selection rounds. This is the module with the
// most real behaviour in the skeleton, because the drive lifecycle is what the
// coordinator UI is built around.
import { Op } from "sequelize";
import { Job, DriveRound } from "./jobs-model.js";
import { Company } from "../companies/companies-model.js";
import { Application, RoundResult } from "../applications/applications-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(Job, {
  include: [
    { model: Company, as: "company", attributes: ["id", "name", "sector", "tier"] },
    { model: DriveRound, as: "rounds" },
  ],
  order: [["posted_at", "DESC"]],
});

export const service = {
  ...base,

  /** Drives a student may apply to: open, undeadlined, and matching eligibility. */
  openForStudent: async (student = {}) => {
    const rows = await Job.findAll({
      where: {
        status: "Applications open",
        [Op.or]: [{ deadline: null }, { deadline: { [Op.gt]: new Date() } }],
      },
      include: [{ model: Company, as: "company", attributes: ["id", "name", "sector"] }],
      order: [["deadline", "ASC"]],
    });
    return rows
      .map((r) => r.toJSON())
      .filter((j) => {
        if (j.min_cgpa != null && student.cgpa != null && student.cgpa < j.min_cgpa) return false;
        if (Array.isArray(j.branches) && j.branches.length && student.branch) {
          return j.branches.includes(student.branch);
        }
        return true;
      });
  },

  listRounds: async (jobId) => {
    const rows = await DriveRound.findAll({ where: { job_id: jobId }, order: [["sequence", "ASC"]] });
    return rows.map((r) => r.toJSON());
  },

  addRound: async (jobId, data) => {
    const job = await Job.findByPk(jobId);
    if (!job) notFound("Drive not found");
    const count = await DriveRound.count({ where: { job_id: jobId } });
    const round = await DriveRound.create({
      job_id: jobId,
      name: data.name,
      type: data.type || null,
      sequence: data.sequence ?? count + 1,
      scheduled_at: data.scheduledAt || data.scheduled_at || null,
    });
    return round.toJSON();
  },

  applicants: async (jobId) => {
    const rows = await Application.findAll({ where: { job_id: jobId }, order: [["applied_at", "ASC"]] });
    return rows.map((r) => r.toJSON());
  },

  /**
   * Record outcomes for one round in bulk.
   * outcomes: [{ studentId, status, score, notes }]
   * Cleared students advance; rejected ones end here.
   */
  recordRoundOutcomes: async (jobId, roundId, outcomes = [], userId = null) => {
    if (!Array.isArray(outcomes) || !outcomes.length) badRequest("No outcomes supplied");
    const round = await DriveRound.findOne({ where: { id: roundId, job_id: jobId } });
    if (!round) notFound("Round not found for this drive");

    const written = [];
    for (const o of outcomes) {
      const [row] = await RoundResult.findOrCreate({
        where: { round_id: roundId, student_id: o.studentId },
        defaults: {
          job_id: jobId, round_id: roundId, student_id: o.studentId,
          application_id: o.applicationId || null,
        },
      });
      await row.update({
        status: o.status || "Pending",
        score: o.score ?? null,
        notes: o.notes || null,
        recorded_by: userId,
        recorded_at: new Date(),
      });
      written.push(row.toJSON());

      // Keep the application's status in step with the round outcome.
      const app = o.applicationId
        ? await Application.findByPk(o.applicationId)
        : await Application.findOne({ where: { job_id: jobId, student_id: o.studentId } });
      if (app) {
        if (o.status === "Rejected") await app.update({ status: "Rejected" });
        else if (o.status === "Cleared") await app.update({ current_round: round.sequence });
      }
    }
    return { written: written.length, results: written };
  },

  /** Undo a round's recorded outcomes — the UI offers this as "revert". */
  revertRoundOutcomes: async (jobId, roundId) => {
    const removed = await RoundResult.destroy({ where: { job_id: jobId, round_id: roundId } });
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
