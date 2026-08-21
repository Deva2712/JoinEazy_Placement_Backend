// src/modules/overview/overview-service.js
//
// Read-only aggregates for the three dashboards (student, coordinator, HOD).
// Everything here is derived — this module owns no tables.
import { Op, fn, col } from "sequelize";
import { Job } from "../jobs/jobs-model.js";
import { Application } from "../applications/applications-model.js";
import { Offer } from "../offers/offers-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { Company } from "../companies/companies-model.js";
import { InterviewSlot } from "../interviews/interviews-model.js";

const countBy = async (Model, column, where = {}) => {
  const rows = await Model.findAll({
    where,
    attributes: [column, [fn("COUNT", col("id")), "count"]],
    group: [column],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r[column], Number(r.count)]));
};

export const service = {
  /** The student's own placement picture. */
  student: async (studentId) => {
    const [applications, offers, roster] = await Promise.all([
      Application.count({ where: { student_id: studentId } }),
      Offer.findAll({ where: { student_id: studentId } }),
      PlacementStudent.findByPk(studentId),
    ]);
    const upcoming = await InterviewSlot.count({
      where: { student_id: studentId, status: "Scheduled", scheduled_at: { [Op.gt]: new Date() } },
    });
    return {
      applications,
      offers: offers.length,
      upcomingInterviews: upcoming,
      status: roster?.placement_status || "Eligible",
      placedAt: roster?.placed_company || null,
    };
  },

  /** Placement-cell view: pipeline health across the whole cycle. */
  coordinator: async () => {
    const [drives, companies, students, offers] = await Promise.all([
      Job.count(),
      Company.count({ where: { status: "active" } }),
      PlacementStudent.count(),
      Offer.findAll({ attributes: ["ctc", "status"], raw: true }),
    ]);
    const placed = await PlacementStudent.count({ where: { placement_status: "Placed" } });
    const accepted = offers.filter((o) => o.status === "Accepted" && o.ctc != null);
    const packages = accepted.map((o) => Number(o.ctc)).filter((n) => !Number.isNaN(n));

    return {
      totals: { drives, companies, students, offers: offers.length, placed },
      placementRate: students ? Math.round((placed / students) * 1000) / 10 : 0,
      package: {
        highest: packages.length ? Math.max(...packages) : null,
        average: packages.length ? Math.round((packages.reduce((a, b) => a + b, 0) / packages.length) * 100) / 100 : null,
      },
      drivesByStatus: await countBy(Job, "status"),
      applicationsByStatus: await countBy(Application, "status"),
    };
  },

  /** HOD view — same shape, scoped to one department/branch. */
  hod: async ({ branch, batchYear } = {}) => {
    const where = {};
    if (branch) where.branch = branch;
    if (batchYear) where.batch_year = batchYear;

    const students = await PlacementStudent.count({ where });
    const placed = await PlacementStudent.count({ where: { ...where, placement_status: "Placed" } });
    const activeDrives = await Job.count({
      where: { status: { [Op.in]: ["Applications open", "Assessment", "Interviews"] } },
    });
    return {
      branch: branch || "All",
      batchYear: batchYear || null,
      students,
      placed,
      placementRate: students ? Math.round((placed / students) * 1000) / 10 : 0,
      activeDrives,
      statusBreakdown: await countBy(PlacementStudent, "placement_status", where),
    };
  },

  /** Placement totals per batch year — the history/reporting screen. */
  batchTotals: async () => {
    const rows = await PlacementStudent.findAll({
      attributes: ["batch_year", [fn("COUNT", col("id")), "students"]],
      group: ["batch_year"],
      raw: true,
    });
    // Placed counts need a second pass — a conditional SUM is dialect-specific
    // and this table is small enough that two queries is the simpler trade.
    const placedRows = await PlacementStudent.findAll({
      where: { placement_status: "Placed" },
      attributes: ["batch_year", [fn("COUNT", col("id")), "placed"]],
      group: ["batch_year"],
      raw: true,
    });
    const placedBy = Object.fromEntries(placedRows.map((r) => [r.batch_year, Number(r.placed)]));
    return rows.map((r) => ({
      batchYear: r.batch_year,
      students: Number(r.students),
      placed: placedBy[r.batch_year] || 0,
    }));
  },
};
