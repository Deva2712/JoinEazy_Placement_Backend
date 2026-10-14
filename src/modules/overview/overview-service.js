// src/modules/overview/overview-service.js
//
// Read-only aggregates for the three dashboards (student, coordinator, HOD).
// Everything here is derived — this module owns no tables.
import { Op, fn, col } from "sequelize";
import { Job } from "../jobs/jobs-model.js";
import { Application } from "../applications/applications-model.js";
import { Offer } from "../offers/offers-model.js";
import { PlacementStudent, StudentPlacementProfile } from "../students/students-model.js";
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
  /**
   * The student's own placement picture — one round-trip that hydrates the
   * whole student portal.
   *
   * Shape note: getPlacementOverview() destructures { jobs, applications,
   * resumeUrl, projectUrl } and renders `applications` as a LIST. The skeleton
   * returned `applications` as a COUNT and no jobs at all, so the portal booted
   * with an empty board. Those four keys are now the contract; the original KPI
   * numbers are kept alongside under distinct names so nothing that read them
   * breaks.
   *
   * Archived drives are excluded: archiving a drive is what stops it accepting
   * new applications, and the coordinator's own getJobs still returns them.
   */
  student: async (userId) => {
    const roster = await PlacementStudent.findOne({ where: { userId } });

    const jobsRows = await Job.findAll({
      where: { archived: { [Op.not]: true } },
      order: [["postedAt", "DESC"]],
    });
    const jobs = jobsRows.map((j) => j.toJSON());

    if (!roster) {
      return {
        jobs, applications: [], resumeUrl: null, projectUrl: null,
        applicationCount: 0, offerCount: 0, upcomingInterviews: 0,
        status: "Not on roster", placedAt: null,
      };
    }

    const [applicationRows, offers, profile] = await Promise.all([
      Application.findAll({ where: { studentId: roster.userId }, order: [["appliedAt", "DESC"]] }),
      Offer.findAll({ where: { studentId: roster.userId } }),
      StudentPlacementProfile.findOne({ where: { studentId: roster.userId } }),
    ]);
    const upcoming = await InterviewSlot.count({
      where: { studentId: roster.userId, status: "Scheduled", scheduledAt: { [Op.gt]: new Date() } },
    });

    return {
      jobs,
      applications: applicationRows.map((a) => a.toJSON()),
      resumeUrl: profile?.resumeUrl ?? null,
      projectUrl: profile?.projectUrl ?? null,
      applicationCount: applicationRows.length,
      offerCount: offers.length,
      upcomingInterviews: upcoming,
      status: roster.placementStatus || "In Process",
      placedAt: roster.placedCompany || null,
    };
  },

  /** Placement-cell view: pipeline health across the whole cycle. */
  coordinator: async () => {
    const [drives, companies, students, offers] = await Promise.all([
      Job.count(),
      Company.count({ where: { status: ["Active", "active"] } }),
      PlacementStudent.count(),
      Offer.findAll({ attributes: ["ctcValue", "status"], raw: true }),
    ]);
    const placed = await PlacementStudent.count({ where: { placementStatus: "Placed" } });
    // ctcValue is the parsed LPA figure; ctc itself is a display string
    // ("₹18–22 LPA") and stipends deliberately leave ctcValue null.
    const accepted = offers.filter((o) => o.status === "Accepted" && o.ctcValue != null);
    const packages = accepted.map((o) => Number(o.ctcValue)).filter((n) => !Number.isNaN(n));

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
    if (batchYear) where.batchYear = batchYear;

    const students = await PlacementStudent.count({ where });
    const placed = await PlacementStudent.count({ where: { ...where, placementStatus: "Placed" } });
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
      statusBreakdown: await countBy(PlacementStudent, "placementStatus", where),
    };
  },

  /**
   * Cohort size per batch year, as { [year]: totalStudents }.
   *
   * Shape note: this used to return an array of
   * { batchYear, students, placed }. The frontend's getBatchTotals() feeds the
   * result straight into placement-% maths as a plain year→total lookup
   * (MOCK_BATCH_TOTALS is `{ 2020: 95, ... }`), so an array silently produced
   * NaN percentages in every Analytics chart. It is the denominator only —
   * placed counts come from the history rows.
   */
  batchTotals: async () => {
    const rows = await PlacementStudent.findAll({
      attributes: ["batchYear", [fn("COUNT", col("id")), "students"]],
      group: ["batchYear"],
      raw: true,
    });
    return Object.fromEntries(
      rows.filter((r) => r.batchYear != null).map((r) => [r.batchYear, Number(r.students)])
    );
  },

  /**
   * Historical per-student placement records — the single list the Analytics
   * tab derives every aggregate from (year totals, top recruiters, branch %,
   * sector mix, package distribution).
   *
   * Derived from accepted offers rather than stored in a parallel history
   * table: v1's Part 7.3 decided "history" is just a normal query over the real
   * offers/students rows once real cycles accumulate, and the mock only carried
   * a separate list because it had no database behind it.
   */
  pastPlacedStudents: async ({ branches = null } = {}) => {
    const offers = await Offer.findAll({
      where: { status: "Accepted" },
      include: [{
        model: PlacementStudent,
        as: "student",
        attributes: ["id", "rollNo", "name", "branch", "batchYear", "cgpa"],
        ...(branches?.length ? { where: { branch: { [Op.in]: branches } } } : {}),
      }],
      order: [["createdAt", "DESC"]],
    });
    return offers.map((o) => {
      const row = o.toJSON();
      return {
        id: row.id,
        year: row.student?.batchYear ?? new Date(row.createdAt).getFullYear(),
        rollNo: row.student?.rollNo ?? row.studentRollNo ?? null,
        name: row.student?.name ?? row.studentName ?? null,
        branch: row.student?.branch ?? row.studentBranch ?? null,
        company: row.companyName ?? null,
        role: row.role ?? null,
        // The UI charts package as a number; ctc keeps the display string.
        package: row.ctcValue ?? null,
        ctc: row.ctc ?? null,
        sector: row.sector ?? null,
        cgpa: row.student?.cgpa ?? null,
      };
    });
  },

  /**
   * Drives still open to a set of branches. "Open" is purely deadline-based
   * (deadline >= now) and drives with no deadline are dropped — matching
   * getActiveDrivesForBranch(es) in the frontend exactly.
   */
  activeDrives: async (branches = []) => {
    const rows = await Job.findAll({
      where: { deadline: { [Op.gte]: new Date() } },
      order: [["deadline", "ASC"]],
    });
    const wanted = new Set(branches);
    return rows
      .map((r) => r.toJSON())
      .filter((j) => !wanted.size
        || (Array.isArray(j.branches) && j.branches.some((b) => wanted.has(b))));
  },

  /** Current-cycle roster for the HOD view, scoped to their branches. */
  currentStudentsRoster: async (branches = []) => {
    const where = branches.length ? { branch: { [Op.in]: branches } } : {};
    const rows = await PlacementStudent.findAll({ where, order: [["rollNo", "ASC"]], raw: true });
    return rows.map((s) => ({
      ...s,
      // Same roster aliasing students-service applies — this endpoint feeds the
      // same table component.
      placementStatus: s.placementStatus === "Placed" ? "Placed"
        : (s.placementStatus === "Not eligible" || s.placementStatus === "Opted out")
          ? "Not Placed" : "In Process",
      year: s.batchYear ?? null,
      company: s.placedCompany ?? null,
      role: s.placedRole ?? null,
      package: s.placedPackage ?? null,
    }));
  },
};
