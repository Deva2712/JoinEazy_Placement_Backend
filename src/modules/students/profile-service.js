// src/modules/students/profile-service.js
//
// The signed-in student's own placement profile and documents — the backing
// service for GET/PATCH /placement/profile and the /placement/documents routes.
//
// Lives in the students module because StudentPlacementProfile is owned by
// students-model.js; it gets its own router (see students-routes.js) because the
// frontend mounts these at /placement/profile and /placement/documents rather
// than under /placement/students.
import { PlacementStudent, StudentPlacementProfile } from "./students-model.js";

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

/**
 * Resolve the roster row for the signed-in account. Placement students are
 * linked by `userId`, the id carried in the JWT — the same lookup
 * applications-service.apply() and overview-service.student() use.
 */
const rosterFor = async (userId) => {
  const roster = await PlacementStudent.findOne({ where: { userId } });
  if (!roster) {
    badRequest("You are not on the placement roster yet — ask the placement cell to add you.");
  }
  return roster;
};

/** One profile row per student, created on first read so PATCH never 404s. */
const profileFor = async (studentId) => {
  const [profile] = await StudentPlacementProfile.findOrCreate({
    where: { studentId },
    defaults: { studentId },
  });
  return profile;
};

// ProfileTab reads these five keys and expects arrays, never null.
const toApi = (p) => ({
  id: p.id,
  studentId: p.studentId,
  resumeUrl: p.resumeUrl ?? null,
  projectUrl: p.projectUrl ?? null,
  linkedinUrl: p.linkedinUrl ?? "",
  githubUrl: p.githubUrl ?? "",
  skills: p.skills ?? [],
  certifications: p.certifications ?? [],
  projects: p.projects ?? [],
  documents: p.documents ?? [],
});

// Only these are patchable — a client cannot rebind the profile to another
// student by including studentId in the body.
const PATCHABLE = ["linkedinUrl", "githubUrl", "skills", "certifications", "projects", "documents", "resumeUrl", "projectUrl"];

export const service = {
  get: async (userId) => {
    const roster = await rosterFor(userId);
    return toApi(await profileFor(roster.id));
  },

  update: async (userId, patch = {}) => {
    const roster = await rosterFor(userId);
    const profile = await profileFor(roster.id);
    const attrs = Object.fromEntries(
      Object.entries(patch).filter(([k]) => PATCHABLE.includes(k))
    );
    await profile.update(attrs);
    return toApi(profile);
  },

  /** GET /placement/documents — the two URLs the student portal renders. */
  documents: async (userId) => {
    const { resumeUrl, projectUrl } = await service.get(userId);
    return { resumeUrl, projectUrl };
  },

  /** Store an uploaded file's URL against the profile. */
  setDocument: async (userId, field, url) => {
    const roster = await rosterFor(userId);
    const profile = await profileFor(roster.id);
    await profile.update({ [field]: url });
    return { [field]: url };
  },
};
