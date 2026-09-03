import { Cohort, CohortAnnouncement } from "./cohort-model.js";

export const service = {
  dashboardOverview: async () => {
    const rows = (await Cohort.findAll({ order: [["cohort_name", "ASC"]] })).map((r) => r.toJSON());
    return {
      createdCohorts: rows.filter((r) => r.kind !== "joined").map(({ id, cohort_name }) => ({ id, cohort_name })),
      joinedCohorts: rows.filter((r) => r.kind === "joined").map(({ id, cohort_name }) => ({ id, cohort_name })),
    };
  },
  announcements: async (cohortId) => (await CohortAnnouncement.findAll({ where: { cohortId }, order: [["created_at", "DESC"]] })).map((r) => r.toJSON()),
  createAnnouncement: async (cohortId, data, user) => (await CohortAnnouncement.create({
    cohortId,
    title: data.title,
    message: data.message,
    content: data.content || data.message,
    priority: data.priority || "Normal",
    attachments: data.attachments || [],
    author_name: data.author_name || user?.name || "Placement Coordinator",
  })).toJSON(),
};
