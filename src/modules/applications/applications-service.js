// src/modules/applications/applications-service.js
import { Op } from "sequelize";
import { Application, RoundResult } from "./applications-model.js";
import { Job } from "../jobs/jobs-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { Offer } from "../offers/offers-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

const base = crudService(Application, {
  include: [{ model: Job, as: "job", attributes: ["id", "role", "company_name", "status", "deadline"] }],
  order: [["applied_at", "DESC"]],
});

export const service = {
  ...base,

  /** Everything one student has applied to. */
  forStudent: async (studentId) => {
    const rows = await Application.findAll({
      where: { student_id: studentId },
      include: [{ model: Job, as: "job", attributes: ["id", "role", "company_name", "status", "deadline"] }],
      order: [["applied_at", "DESC"]],
    });
    return rows.map((r) => r.toJSON());
  },

  /**
   * Apply to a drive. Enforces the three rules the UI relies on: the drive must
   * be open, the deadline unpassed, and a student may not apply twice.
   */
  apply: async (jobId, student) => {
    const job = await Job.findByPk(jobId);
    if (!job) notFound("Drive not found");
    if (job.status !== "Applications open") badRequest("This drive is not accepting applications");
    if (job.deadline && new Date() > new Date(job.deadline)) badRequest("The deadline for this drive has passed");

    const existing = await Application.findOne({ where: { job_id: jobId, student_id: student.id } });
    if (existing) return { application: existing.toJSON(), alreadyApplied: true };

    // The roster row is required, not optional: applications are FK'd to it, and
    // eligibility (CGPA, branch) cannot be judged without it. Failing here with a
    // clear message beats leaking a foreign-key violation to the client.
    const roster = await PlacementStudent.findByPk(student.id);
    if (!roster) {
      badRequest("You are not on the placement roster yet — ask the placement cell to add you.");
    }

    // Eligibility, evaluated against the roster.
    if (job.min_cgpa != null && roster.cgpa != null && roster.cgpa < job.min_cgpa) {
      badRequest(`This drive requires a CGPA of ${job.min_cgpa} or above.`);
    }
    if (Array.isArray(job.branches) && job.branches.length && roster.branch
        && !job.branches.includes(roster.branch)) {
      badRequest("This drive is not open to your branch.");
    }

    const application = await Application.create({
      job_id: jobId,
      student_id: student.id,
      student_name: roster.name || student.name || null,
      student_roll: roster.roll_no || null,
      resume_url: student.resumeUrl || null,
      status: "Applied",
    });
    return { application: application.toJSON(), alreadyApplied: false };
  },

  /** Move an application along; accepting an offer also updates the roster. */
  setStatus: async (applicationId, status, extra = {}) => {
    const app = await Application.findByPk(applicationId);
    if (!app) notFound("Application not found");
    await app.update({ status, notes: extra.notes ?? app.notes });

    if (status === "Accepted") {
      const offer = await Offer.findOne({ where: { application_id: applicationId } });
      const roster = await PlacementStudent.findByPk(app.student_id);
      if (roster) {
        await roster.update({
          placement_status: "Placed",
          placed_company: offer?.company_name ?? roster.placed_company,
          placed_role:    offer?.role ?? roster.placed_role,
          placed_package: offer?.ctc ?? roster.placed_package,
          sector:         offer?.sector ?? roster.sector,
        });
      }
    }
    return app.toJSON();
  },

  /** Bulk status update — the coordinator's shortlist action. */
  setStatusBulk: async (ids = [], status) => {
    if (!Array.isArray(ids) || !ids.length) badRequest("No application ids supplied");
    const [count] = await Application.update({ status }, { where: { id: { [Op.in]: ids } } });
    return { updated: count, status };
  },

  roundResults: async (jobId, roundId = null) => {
    const where = { job_id: jobId };
    if (roundId) where.round_id = roundId;
    const rows = await RoundResult.findAll({ where, order: [["recorded_at", "DESC"]] });
    return rows.map((r) => r.toJSON());
  },
};
