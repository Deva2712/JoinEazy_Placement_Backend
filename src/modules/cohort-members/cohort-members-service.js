// src/modules/cohort-members/cohort-members-service.js
import CohortMember from "./cohort-members-model.js";

// GET /cohort/:cohortId/members?limit=2000&page=1
export const getMembers = async (cohortId, { limit = 2000, page = 1 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await CohortMember.findAndCountAll({
    where: { cohort_id: cohortId },
    order: [["role", "ASC"], ["name", "ASC"]],
    limit: Number(limit),
    offset,
  });
  return { members: rows.map((m) => m.toJSON()), total: count, page: Number(page), limit: Number(limit) };
};

export const addMember = async (cohortId, data) => {
  const [member, created] = await CohortMember.findOrCreate({
    where: { cohort_id: cohortId, user_id: data.user_id || data.userId },
    defaults: {
      cohort_id:  cohortId,
      user_id:    data.user_id || data.userId,
      name:       data.name,
      email:      data.email || null,
      avatar:     data.avatar || null,
      role:       data.role || "student",
      department: data.department || null,
    },
  });
  return { member: member.toJSON(), created };
};

export const removeMember = async (cohortId, userId) => {
  const member = await CohortMember.findOne({ where: { cohort_id: cohortId, user_id: userId } });
  if (!member) { const e = new Error("Member not found"); e.statusCode = 404; throw e; }
  await member.destroy();
  return { deleted: true };
};