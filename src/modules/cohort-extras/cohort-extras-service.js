import { Cohort } from "../cohort/cohort-model.js";
import {
  CohortDetailSection,
  CohortGroup,
  CohortGroupMember,
  CohortParticipant,
} from "./cohort-extras-model.js";

const notFound = (message) => {
  const err = new Error(message);
  err.statusCode = 404;
  throw err;
};

const displayName = (user = {}) =>
  user.name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Placement Coordinator";

const loadCohort = async (cohortId) => {
  const cohort = await Cohort.findByPk(cohortId);
  if (!cohort) notFound("Cohort not found");
  return cohort;
};

export const getArchivedCohorts = async () => [];

export const getCohortDetails = async (cohortId, userId, userRole) => {
  const cohort = await loadCohort(cohortId);
  const sections = await CohortDetailSection.findAll({
    where: { cohort_id: cohortId },
    order: [["order", "ASC"], ["created_at", "ASC"]],
  });
  const groups = await CohortGroup.findAll({ where: { cohort_id: cohortId } });
  const participantCount = await CohortParticipant.count({ where: { cohort_id: cohortId, is_active: true } });
  const ownGroup = userId
    ? await CohortGroupMember.findOne({
        where: { user_id: String(userId) },
        include: [{ model: CohortGroup, as: "group", where: { cohort_id: cohortId }, required: true }],
      })
    : null;

  const row = cohort.toJSON();
  const isAdmin = ["placement_coordinator", "admin", "hod", "dean", "professor"].includes(userRole);
  return {
    id: row.id,
    cohort_name: row.cohort_name,
    title: row.cohort_name,
    name: row.cohort_name,
    cohort_description: row.cohort_description || "",
    description: row.cohort_description || "",
    course_codes: row.course_codes || [],
    organization_name: row.organization_name || "Mahindra University",
    instructor: row.instructor || "Placement Cell",
    creator_id: row.creator_id || null,
    creator_name: row.creator_name || "Placement Cell",
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    status: row.status || "Live",
    visibility: row.visibility || "Active",
    member_count: row.member_count ?? participantCount,
    group_count: row.group_count ?? groups.length,
    user_type: isAdmin ? 1 : 0,
    is_admin: isAdmin,
    group_name: ownGroup?.group?.group_name || null,
    is_group_leader: ownGroup?.role === "leader",
    max_groups_members: row.max_groups_members ?? 4,
    min_groups_members: row.min_groups_members ?? 1,
    max_course_members: row.max_course_members ?? 1400,
    office_hours: row.office_hours || [],
    detail_sections: sections.map((s) => s.toJSON()),
  };
};

export const getCohortById = (cohortId, userId, userRole) => getCohortDetails(cohortId, userId, userRole);

export const addDetailSection = async (cohortId, data) => {
  await loadCohort(cohortId);
  const count = await CohortDetailSection.count({ where: { cohort_id: cohortId } });
  return (await CohortDetailSection.create({
    cohort_id: cohortId,
    title: data.title,
    subsec_description: data.subsec_description || data.content || "",
    order: data.order ?? count,
  })).toJSON();
};

export const editDetailSection = async (cohortId, detailId, data) => {
  const section = await CohortDetailSection.findOne({ where: { id: detailId, cohort_id: cohortId } });
  if (!section) notFound("Detail section not found");
  await section.update({
    title: data.title ?? section.title,
    subsec_description: data.subsec_description ?? data.content ?? section.subsec_description,
    order: data.order ?? section.order,
  });
  return section.toJSON();
};

export const deleteDetailSection = async (cohortId, detailId) => {
  const section = await CohortDetailSection.findOne({ where: { id: detailId, cohort_id: cohortId } });
  if (!section) notFound("Detail section not found");
  await section.destroy();
  return { deleted: true };
};

export const createGroup = async (cohortId, data, user = {}) => {
  await loadCohort(cohortId);
  const group = await CohortGroup.create({
    cohort_id: cohortId,
    group_name: data.group_name || data.name,
    group_description: data.group_description || data.description || null,
    project_name: data.project_name || data.projectName || null,
  });

  const members = Array.isArray(data.members) ? data.members : [];
  if (user.id && !members.map(String).includes(String(user.id))) members.unshift(user.id);
  await Promise.all(members.map((memberId, index) =>
    CohortGroupMember.findOrCreate({
      where: { group_id: group.id, user_id: String(memberId) },
      defaults: { group_id: group.id, user_id: String(memberId), email: user.email || null, role: index === 0 ? "leader" : "member" },
    })
  ));
  return group.toJSON();
};

export const updateGroup = async (cohortId, groupId, data) => {
  const group = await CohortGroup.findOne({ where: { id: groupId, cohort_id: cohortId } });
  if (!group) notFound("Group not found");
  await group.update({
    group_name: data.group_name ?? data.name ?? group.group_name,
    group_description: data.group_description ?? data.description ?? group.group_description,
    project_name: data.project_name ?? data.projectName ?? group.project_name,
  });
  return group.toJSON();
};

export const deleteGroup = async (cohortId, groupId) => {
  const group = await CohortGroup.findOne({ where: { id: groupId, cohort_id: cohortId } });
  if (!group) notFound("Group not found");
  await CohortGroupMember.destroy({ where: { group_id: groupId } });
  await group.destroy();
  return { deleted: true };
};

export const getGroupDetails = async (cohortId, groupId) => {
  const group = await CohortGroup.findOne({ where: { id: groupId, cohort_id: cohortId } });
  if (!group) notFound("Group not found");
  const members = await CohortGroupMember.findAll({ where: { group_id: groupId } });
  return { group: group.toJSON(), members: members.map((m) => m.toJSON()) };
};

export const getAvailableMembers = async (cohortId, groupId) => {
  const participants = await CohortParticipant.findAll({ where: { cohort_id: cohortId, is_active: true } });
  const existing = await CohortGroupMember.findAll({ where: { group_id: groupId } });
  const taken = new Set(existing.map((m) => String(m.user_id)));
  return participants.filter((p) => !taken.has(String(p.user_id))).map((p) => p.toJSON());
};

export const removeGroupMember = async (groupId, targetUserId) => {
  const member = await CohortGroupMember.findOne({ where: { group_id: groupId, user_id: String(targetUserId) } });
  if (!member) notFound("Member not found");
  await member.destroy();
  return { deleted: true };
};

export const addMembersToGroup = async (groupId, memberUserIds = []) => {
  const rows = await Promise.all(memberUserIds.map((userId) =>
    CohortGroupMember.findOrCreate({
      where: { group_id: groupId, user_id: String(userId) },
      defaults: { group_id: groupId, user_id: String(userId), role: "member" },
    })
  ));
  return rows.map(([row]) => row.toJSON());
};

export const uploadParticipants = async (cohortId, participants = []) => {
  await loadCohort(cohortId);
  const rows = Array.isArray(participants) ? participants : participants.participants || [];
  const saved = await Promise.all(rows.map((p) =>
    CohortParticipant.findOrCreate({
      where: { cohort_id: cohortId, email: p.email },
      defaults: {
        cohort_id: cohortId,
        user_id: p.user_id || p.userId || null,
        email: p.email,
        display_name: p.display_name || p.name || p.email,
        username: p.username || p.name || p.email,
        roll_number: p.roll_number || p.rollNo || null,
        profile_pic: p.profile_pic || p.avatar || null,
        is_active: true,
      },
    })
  ));
  return { participants: saved.map(([row]) => row.toJSON()) };
};

export const removeParticipant = async (cohortId, targetUserId) => {
  const where = { cohort_id: cohortId };
  if (targetUserId) where.user_id = String(targetUserId);
  const count = await CohortParticipant.destroy({ where });
  return { deleted: count };
};

export const getCohortMembers = async (cohortId) => {
  const participants = await CohortParticipant.findAll({ where: { cohort_id: cohortId, is_active: true } });
  const groups = await CohortGroup.findAll({ where: { cohort_id: cohortId } });
  return {
    participants: participants.map((p) => p.toJSON()),
    groups: groups.map((g) => g.toJSON()),
    is_group: false,
  };
};

export const generateInvitationLink = async (cohortId) => ({ cohort_id: cohortId, invitation_link: null });
export const getInvitationStatus = async (cohortId) => ({ cohort_id: cohortId, enabled: false });
export const acceptGroupInvite = async () => ({ accepted: false });
export const joinWithInvitation = async () => ({ joined: false });
export const getLeaderboard = async () => [];
export const getIndividualLeaderboard = async () => [];
export const getGroupLeaderboard = async () => [];
export const getGrades = async () => ({ grades: [] });
export const submitCourseWork = async () => ({ submitted: true });
export const getSubmission = async () => null;
export const updateSubmission = async () => ({ updated: true });
export const deleteSubmission = async () => ({ deleted: true });
export const uploadProjects = async () => ({ uploaded: true });
