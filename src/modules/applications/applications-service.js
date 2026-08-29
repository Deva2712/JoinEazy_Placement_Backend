// src/modules/applications/applications-service.js
import { Op } from "sequelize";
import { Application, RoundResult } from "./applications-model.js";
import { Job } from "../jobs/jobs-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { Offer } from "../offers/offers-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const INCLUDE = [
  { model: Job, as: "job", attributes: ["id", "role", "companyName", "type", "location", "package", "stipend", "rounds", "status", "deadline"] },
  { model: PlacementStudent, as: "student", attributes: ["id", "rollNo", "name", "branch", "cgpa"] },
];

const base = crudService(Application, { include: INCLUDE, order: [["appliedAt", "DESC"]] });

/**
 * The ATS board, funnel, PPO tile and company drill-downs all read an
 * application as a FLAT row — `company`, `role`, `type`, `studentBranch`,
 * `studentCgpa`, `package` — and key students by roll number, not UUID. Only
 * `status` was ever present on the row itself, so those columns rendered blank
 * and the PPO tile reported "No interns yet" because it filters on
 * `application.type === "Internship"`.
 *
 * The nested `job`/`student` objects are kept alongside for anything that
 * prefers them.
 */
const toApi = (row) => ({
  ...row,
  studentId: row.student?.rollNo ?? row.studentRoll ?? row.studentId,
  studentName: row.studentName ?? row.student?.name ?? null,
  studentBranch: row.student?.branch ?? null,
  studentCgpa: row.student?.cgpa ?? null,
  company: row.job?.companyName ?? null,
  role: row.job?.role ?? null,
  type: row.job?.type ?? null,
  location: row.job?.location ?? null,
  package: row.job?.package ?? row.job?.stipend ?? null,
  rounds: row.job?.rounds ?? null,
});

export const service = {
  ...base,

  list: async (query) => (await base.list(query)).map(toApi),
  get: async (id) => toApi(await base.get(id)),

  forStudent: async (userId) => {
    const roster = await PlacementStudent.findOne({ where: { userId } });
    if (!roster) return [];
    const rows = await Application.findAll({
      where: { studentId: roster.id },
      include: INCLUDE,
      order: [["appliedAt", "DESC"]],
    });
    return rows.map((r) => toApi(r.toJSON()));
  },

  apply: async (jobId, student) => {
    const job = await Job.findByPk(jobId);
    if (!job) notFound("Drive not found");
    if (job.status !== "Applications open") badRequest("This drive is not accepting applications");
    if (job.deadline && new Date() > new Date(job.deadline)) badRequest("The deadline for this drive has passed");

    const roster = await PlacementStudent.findOne({ where: { userId: student.id } });
    if (!roster) {
      badRequest("You are not on the placement roster yet — ask the placement cell to add you.");
    }

    const existing = await Application.findOne({ where: { jobId: jobId, studentId: roster.id } });
    if (existing) return { application: existing.toJSON(), alreadyApplied: true };

    if (job.minCgpa != null && roster.cgpa != null && roster.cgpa < job.minCgpa) {
      badRequest(`This drive requires a CGPA of ${job.minCgpa} or above.`);
    }
    if (Array.isArray(job.branches) && job.branches.length && roster.branch
        && !job.branches.includes(roster.branch)) {
      badRequest("This drive is not open to your branch.");
    }

    const application = await Application.create({
      jobId: jobId,
      studentId: roster.id,
      studentName: roster.name || student.name || null,
      studentRoll: roster.rollNo || null,
      resumeUrl: student.resumeUrl || null,
      status: "Applied",
    });
    return { application: application.toJSON(), alreadyApplied: false };
  },

  setStatus: async (applicationId, status, extra = {}) => {
    const app = await Application.findByPk(applicationId);
    if (!app) notFound("Application not found");
    await app.update({ status, notes: extra.notes ?? app.notes });

    // "Placed" is the frontend's terminal success state (APPLICATION_STATUSES in
    // placementCoordConstants.js); "Accepted" is the skeleton's older name for
    // the same moment and is still accepted so existing rows keep working.
    if (status === "Placed" || status === "Accepted") {
      const offer = await Offer.findOne({ where: { applicationId: applicationId } });
      const roster = await PlacementStudent.findByPk(app.studentId);
      if (roster) {
        await roster.update({
          placementStatus: "Placed",
          placedCompany: offer?.companyName ?? roster.placedCompany,
          placedRole:    offer?.role ?? roster.placedRole,
          // placedPackage is numeric — ctcValue, not the ctc display string.
          placedPackage: offer?.ctcValue ?? roster.placedPackage,
          sector:         offer?.sector ?? roster.sector,
        });
      }
    }
    return app.toJSON();
  },

  setStatusBulk: async (ids = [], status) => {
    if (!Array.isArray(ids) || !ids.length) badRequest("No application ids supplied");
    const [count] = await Application.update({ status }, { where: { id: { [Op.in]: ids } } });
    return { updated: count, status };
  },

  roundResults: async (jobId, roundId = null) => {
    const where = { jobId: jobId };
    if (roundId) where.roundId = roundId;
    const rows = await RoundResult.findAll({ where, order: [["recordedAt", "DESC"]] });
    return rows.map((r) => r.toJSON());
  },
};
