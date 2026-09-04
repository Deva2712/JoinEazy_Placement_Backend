// src/modules/overview/overview-service.js
//
// Read-only aggregates for the four role dashboards (student, coordinator,
// professor, HoD). Prof and HoD share `branchOverview` — they differ only in
// how many branches `branchScope` lets through, never in the query.
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

  /**
   * Placement totals per batch year — the history/reporting screen.
   * Scoped, because a professor reading it must not see other branches.
   */
  batchTotals: async ({ branches } = {}) => {
    const where = branches?.length ? { branch: { [Op.in]: branches } } : {};
    const rows = await PlacementStudent.findAll({
      where,
      attributes: ["batch_year", [fn("COUNT", col("id")), "students"]],
      group: ["batch_year"],
      raw: true,
    });
    // Placed counts need a second pass — a conditional SUM is dialect-specific
    // and this table is small enough that two queries is the simpler trade.
    const placedRows = await PlacementStudent.findAll({
      where: { ...where, placement_status: "Placed" },
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

  /**
   * Branch-scoped placement picture — backs BOTH /prof/overview (one branch)
   * and /hod/overview (several). The two roles differ only in how many branches
   * `branchScope` hands over, so they share one query rather than two that
   * drift apart.
   *
   * Shape matches what the frontend expects from getProfPlacementOverview /
   * getHodPlacementOverview: { pastPlacedStudents, batchTotals, branches }.
   */
  branchOverview: async ({ branches } = {}) => {
    const where = branches?.length ? { branch: { [Op.in]: branches } } : {};

    const [students, placed, pastPlacedStudents] = await Promise.all([
      PlacementStudent.count({ where }),
      PlacementStudent.count({ where: { ...where, placement_status: "Placed" } }),
      PlacementStudent.findAll({
        where: { ...where, placement_status: "Placed" },
        order: [["batch_year", "DESC"], ["name", "ASC"]],
        raw: true,
      }),
    ]);

    return {
      branches: branches || null,
      students,
      placed,
      placementRate: students ? Math.round((placed / students) * 1000) / 10 : 0,
      pastPlacedStudents,
      batchTotals: await service.batchTotalsMap({ branches }),
      statusBreakdown: await countBy(PlacementStudent, "placement_status", where),
    };
  },

  /** Open drives a scoped set of branches is eligible for. */
  activeDrives: async ({ branches } = {}) => {
    const open = await Job.findAll({
      where: {
        status: { [Op.in]: ["Applications open", "Assessment", "Interviews"] },
        [Op.or]: [{ deadline: null }, { deadline: { [Op.gte]: new Date() } }],
      },
      order: [["deadline", "ASC"]],
      raw: true,
    });
    if (!branches?.length) return open;
    // ponytail: eligibility filtered in JS — Job.branches is a JSON array, and
    // containment on it is dialect-specific SQL. A cycle holds tens of drives,
    // not thousands. Move to jsonb @> with a GIN index if that stops being true.
    return open.filter((j) => {
      const eligible = Array.isArray(j.branches) ? j.branches : [];
      return eligible.length === 0 || eligible.some((b) => branches.includes(b));
    });
  },

  /** The current (not-yet-graduated) roster for a scoped set of branches. */
  currentStudents: async ({ branches } = {}) => {
    const where = branches?.length ? { branch: { [Op.in]: branches } } : {};
    return PlacementStudent.findAll({
      where: { ...where, placement_status: { [Op.ne]: "Opted out" } },
      order: [["branch", "ASC"], ["roll_no", "ASC"]],
      raw: true,
    });
  },

  /** Every placed student, scoped — the history/alumni tables. */
  pastPlaced: async ({ branches } = {}) => {
    const where = branches?.length ? { branch: { [Op.in]: branches } } : {};
    return PlacementStudent.findAll({
      where: { ...where, placement_status: "Placed" },
      order: [["batch_year", "DESC"], ["name", "ASC"]],
      raw: true,
    });
  },

  /**
   * batchTotals as a { year: total } map — the shape the prof/HoD charts want,
   * where batchTotals() returns the row list the coordinator's table wants.
   */
  batchTotalsMap: async ({ branches } = {}) => {
    const where = branches?.length ? { branch: { [Op.in]: branches } } : {};
    const rows = await PlacementStudent.findAll({
      where,
      attributes: ["batch_year", [fn("COUNT", col("id")), "students"]],
      group: ["batch_year"],
      raw: true,
    });
    return Object.fromEntries(rows.map((r) => [r.batch_year, Number(r.students)]));
  },
};
