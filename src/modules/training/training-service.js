// src/modules/training/training-service.js
//
// Training programmes, sessions, attendance, tests and scores — the backing
// service for the coordinator's Training tab.
//
// Identity note: everywhere the UI says `studentId` in this module it means a
// ROLL NUMBER, not a UUID (attendance rows and score rows are keyed that way in
// the mock and in every CSV the coordinator uploads). Writes resolve it against
// the roster and store the real FK; reads emit the roll number back.
import { Op } from "sequelize";
import {
  TrainingInstructor, TrainingCourse, CourseEnrollment,
  TrainingSession, TrainingAttendance, TrainingTest, TrainingScore,
} from "./training-model.js";
import { PlacementStudent } from "../students/students-model.js";
import { crudService } from "../../utils/crud.js";

const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };

/** rollNo (or UUID) → roster row. */
const resolveStudent = async (studentId) => {
  if (!studentId) badRequest("studentId is required");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(studentId));
  const roster = isUuid
    ? await PlacementStudent.findByPk(studentId)
    : await PlacementStudent.findOne({ where: { rollNo: String(studentId) } });
  if (!roster) badRequest(`No student on the placement roster matches "${studentId}".`);
  return roster;
};

const attendanceToApi = (row) => ({
  ...row,
  studentId: row.studentRollNo ?? row.studentId,
});

const scoreToApi = (row) => ({
  ...row,
  studentId: row.studentRollNo ?? row.studentId,
});

const courses = crudService(TrainingCourse, { order: [["startDate", "ASC"]] });
const sessions = crudService(TrainingSession, { order: [["date", "ASC"]] });
const tests = crudService(TrainingTest, { order: [["date", "DESC"]] });

export const service = {
  // ─── Instructors ───────────────────────────────────────────────────────────
  listInstructors: async () => {
    const rows = await TrainingInstructor.findAll({ order: [["name", "ASC"]], raw: true });
    return rows;
  },

  // ─── Courses ───────────────────────────────────────────────────────────────
  ...courses,
  listCourses: courses.list,
  createCourse: courses.create,
  updateCourse: courses.update,
  /**
   * Deleting a programme cascades to its sessions (and their attendance) and
   * enrolments via onDelete: CASCADE. Tests keep a nullable courseId, so they
   * survive as standalone tests rather than vanishing with the programme.
   */
  deleteCourse: async (id) => {
    const row = await TrainingCourse.findByPk(id);
    if (!row) notFound("Course not found");
    await TrainingTest.update({ courseId: null }, { where: { courseId: id } });
    await row.destroy();
    return { deleted: true, id };
  },

  // ─── Sessions ──────────────────────────────────────────────────────────────
  listSessions: async (query = {}) => {
    const where = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.category) where.category = query.category;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date[Op.gte] = query.from;
      if (query.to) where.date[Op.lte] = query.to;
    }
    const rows = await TrainingSession.findAll({ where, order: [["date", "ASC"]] });
    return rows.map((r) => r.toJSON());
  },
  getSession: sessions.get,
  createSession: sessions.create,
  updateSession: sessions.update,
  deleteSession: sessions.remove,

  // ─── Attendance ────────────────────────────────────────────────────────────
  attendanceForSession: async (sessionId) => {
    const rows = await TrainingAttendance.findAll({ where: { sessionId }, raw: true });
    return rows.map(attendanceToApi);
  },

  attendanceForStudent: async (studentId) => {
    const roster = await resolveStudent(studentId);
    const rows = await TrainingAttendance.findAll({ where: { studentId: roster.id }, raw: true });
    return rows.map(attendanceToApi);
  },

  /**
   * Upsert one attendance row. Used both for a student registering
   * (`registered: true`, present left null) and for the coordinator marking the
   * register afterwards — the UI calls the same shape for both, so only the
   * keys actually supplied are written.
   */
  markAttendance: async ({ sessionId, studentId, registered, present, notes } = {}, markedBy = null) => {
    if (!sessionId) badRequest("sessionId is required");
    const session = await TrainingSession.findByPk(sessionId);
    if (!session) notFound("Session not found");
    const roster = await resolveStudent(studentId);

    const [row] = await TrainingAttendance.findOrCreate({
      where: { sessionId, studentId: roster.id },
      defaults: { sessionId, studentId: roster.id, studentRollNo: roster.rollNo },
    });
    const patch = { studentRollNo: roster.rollNo, markedBy };
    if (registered !== undefined) patch.registered = registered;
    if (present !== undefined) patch.present = present;
    if (notes !== undefined) patch.notes = notes;
    await row.update(patch);
    return attendanceToApi(row.toJSON());
  },

  /** Bulk register-marking for a whole session; one bad row never aborts the rest. */
  bulkMarkAttendance: async (entries = [], markedBy = null) => {
    if (!Array.isArray(entries)) badRequest("Expected an array of attendance entries");
    const written = [];
    const failed = [];
    for (const [i, entry] of entries.entries()) {
      try {
        written.push(await service.markAttendance(entry, markedBy));
      } catch (err) {
        failed.push({ index: i, studentId: entry?.studentId ?? null, error: err.message });
      }
    }
    return { written: written.length, failed: failed.length, attendance: written, errors: failed };
  },

  // ─── Tests & scores ────────────────────────────────────────────────────────
  listTests: async (query = {}) => {
    const where = {};
    if (query.category) where.category = query.category;
    if (query.courseId) where.courseId = query.courseId;
    const rows = await TrainingTest.findAll({ where, order: [["date", "DESC"]] });
    return rows.map((r) => r.toJSON());
  },
  getTest: tests.get,
  updateTest: tests.update,
  deleteTest: tests.remove,

  /**
   * Auto-number a new test within its category ("Aptitude Test 3") unless the
   * caller supplied one — the UI labels tests by that number and leaving it
   * null renders "Test undefined".
   */
  createTest: async (data = {}) => {
    let { testNumber } = data;
    if (testNumber == null && data.category) {
      const count = await TrainingTest.count({ where: { category: data.category } });
      testNumber = count + 1;
    }
    const row = await TrainingTest.create({ ...data, testNumber });
    return row.toJSON();
  },

  listScores: async (query = {}) => {
    const where = {};
    if (query.testId) where.testId = query.testId;
    if (query.studentId) {
      const roster = await resolveStudent(query.studentId);
      where.studentId = roster.id;
    }
    const rows = await TrainingScore.findAll({ where, order: [["recordedAt", "DESC"]], raw: true });
    return rows.map(scoreToApi);
  },

  /** Upsert on (testId, student) — re-uploading a score corrects it, not duplicates it. */
  addScore: async ({ testId, studentId, score, notes } = {}) => {
    if (!testId) badRequest("testId is required");
    const test = await TrainingTest.findByPk(testId);
    if (!test) notFound("Test not found");
    const roster = await resolveStudent(studentId);
    if (score != null && test.maxScore != null && Number(score) > Number(test.maxScore)) {
      badRequest(`Score ${score} exceeds this test's maximum of ${test.maxScore}.`);
    }
    const [row] = await TrainingScore.findOrCreate({
      where: { testId, studentId: roster.id },
      defaults: { testId, studentId: roster.id, studentRollNo: roster.rollNo },
    });
    await row.update({
      studentRollNo: roster.rollNo,
      score: score ?? null,
      notes: notes ?? null,
      recordedAt: new Date(),
    });
    return scoreToApi(row.toJSON());
  },

  updateScore: async (id, patch = {}) => {
    const row = await TrainingScore.findByPk(id);
    if (!row) notFound("Score not found");
    await row.update({
      ...(patch.score !== undefined ? { score: patch.score } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      recordedAt: new Date(),
    });
    return scoreToApi(row.toJSON());
  },

  // ─── Enrolments ────────────────────────────────────────────────────────────
  enroll: async ({ courseId, studentId } = {}) => {
    if (!courseId) badRequest("courseId is required");
    const course = await TrainingCourse.findByPk(courseId);
    if (!course) notFound("Course not found");
    const roster = await resolveStudent(studentId);
    if (course.capacity != null) {
      const taken = await CourseEnrollment.count({ where: { courseId, status: "Enrolled" } });
      if (taken >= course.capacity) badRequest("This course is full.");
    }
    const [row] = await CourseEnrollment.findOrCreate({
      where: { courseId, studentId: roster.id },
      defaults: { courseId, studentId: roster.id },
    });
    return row.toJSON();
  },

  listEnrollments: async (query = {}) => {
    const where = {};
    if (query.courseId) where.courseId = query.courseId;
    const rows = await CourseEnrollment.findAll({
      where,
      include: [{ model: PlacementStudent, as: "student", attributes: ["id", "rollNo", "name", "branch", "cgpa"] }],
      order: [["enrolledAt", "ASC"]],
    });
    return rows.map((r) => {
      const row = r.toJSON();
      return { ...row, studentId: row.student?.rollNo ?? row.studentId };
    });
  },
};
