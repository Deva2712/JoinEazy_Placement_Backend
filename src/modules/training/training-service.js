// src/modules/training/training-service.js
//
// Programs (courses) keep the generic CRUD; the sub-resources below are the
// professor's actual working surface — the classes they run, the attendance
// they mark and the scores they record. See training-routes.js for who may
// call what.
import { Op } from "sequelize";
import {
  TrainingCourse, TrainingSession, TrainingAttendance, TrainingTest, TrainingScore,
} from "./training-model.js";
import { crudService } from "../../utils/crud.js";
import { ROLES } from "../../middleware/auth.middleware.js";

const notFound = (msg) => { const e = new Error(msg); e.statusCode = 404; throw e; };
const forbidden = (msg) => { const e = new Error(msg); e.statusCode = 403; throw e; };

export const service = crudService(TrainingCourse);

/**
 * The training authorisation rule, in one place because four endpoints need it
 * and a copy in each is how they drift apart.
 *
 * A coordinator may touch any program. A professor may touch only a program
 * they instruct — this is the single exception to "coordinator is the only
 * writer", and it is exactly as wide as the frontend's prof workspace, which
 * only ever loads the sessions of programs returned by getInstructorPrograms.
 */
export const assertMayWriteCourse = async (user, courseId) => {
  if (user.role === ROLES.COORDINATOR) return;
  const course = await TrainingCourse.findByPk(courseId);
  if (!course) notFound("Training program not found");
  if (user.role === ROLES.PROFESSOR && course.instructor_id === user.id) return;
  forbidden("Only the coordinator or this program's instructor may record training data");
};

export const sessions = {
  /** Classes, optionally narrowed to one program or one instructor. */
  list: async ({ courseId, instructorId } = {}) => {
    const where = {};
    if (courseId) where.course_id = courseId;
    if (instructorId) where.instructor_id = instructorId;
    return TrainingSession.findAll({ where, order: [["scheduled_at", "ASC"]], raw: true });
  },

  create: async (data) => (await TrainingSession.create(data)).toJSON(),

  update: async (id, data) => {
    const row = await TrainingSession.findByPk(id);
    if (!row) notFound("Session not found");
    await row.update(data);
    return row.toJSON();
  },

  remove: async (id) => {
    const row = await TrainingSession.findByPk(id);
    if (!row) notFound("Session not found");
    await row.destroy();
    return { deleted: true, id };
  },

  /** The program a session belongs to — needed to authorise a write on it. */
  courseIdOf: async (sessionId) => {
    const row = await TrainingSession.findByPk(sessionId, { attributes: ["course_id"] });
    if (!row) notFound("Session not found");
    return row.course_id;
  },
};

export const attendance = {
  forSession: async (sessionId) =>
    TrainingAttendance.findAll({ where: { session_id: sessionId }, raw: true }),

  forStudent: async (studentId) =>
    TrainingAttendance.findAll({ where: { student_id: studentId }, raw: true }),

  /**
   * Mark one or many students present/absent for a session. Upsert rather than
   * insert: the prof screen toggles the same row repeatedly, and a plain create
   * would pile up duplicates against the (session_id, student_id) unique index.
   */
  mark: async (sessionId, rows = [], markedBy = null) => {
    const written = [];
    for (const { studentId, status = "Present", present } of rows) {
      // The frontend sends a boolean `present`; accept either spelling.
      const value = present === undefined ? status : (present ? "Present" : "Absent");
      const [row] = await TrainingAttendance.findOrCreate({
        where: { session_id: sessionId, student_id: studentId },
        defaults: { status: value, marked_by: markedBy },
      });
      if (row.status !== value) await row.update({ status: value, marked_by: markedBy });
      written.push(row.toJSON());
    }
    return written;
  },
};

export const tests = {
  list: async ({ courseId } = {}) => {
    const where = courseId ? { course_id: courseId } : {};
    return TrainingTest.findAll({ where, order: [["held_on", "DESC"]], raw: true });
  },

  create: async (data) => (await TrainingTest.create(data)).toJSON(),

  courseIdOf: async (testId) => {
    const row = await TrainingTest.findByPk(testId, { attributes: ["course_id"] });
    if (!row) notFound("Test not found");
    return row.course_id;
  },
};

export const scores = {
  forTest: async (testId) => TrainingScore.findAll({ where: { test_id: testId }, raw: true }),

  forStudent: async (studentId) =>
    TrainingScore.findAll({ where: { student_id: studentId }, raw: true }),

  /** Same upsert reasoning as attendance.mark — one score per student per test. */
  record: async (testId, rows = [], recordedBy = null) => {
    const test = await TrainingTest.findByPk(testId);
    if (!test) notFound("Test not found");

    const written = [];
    for (const { studentId, score, notes = null } of rows) {
      // A score outside the test's range is a data-entry slip, not a valid
      // record — reject it here rather than letting it skew every average.
      if (score != null && (Number(score) < 0 || Number(score) > test.max_score)) {
        const e = new Error(`Score ${score} is outside 0–${test.max_score} for this test`);
        e.statusCode = 400;
        throw e;
      }
      const [row] = await TrainingScore.findOrCreate({
        where: { test_id: testId, student_id: studentId },
        defaults: { score, notes, recorded_by: recordedBy },
      });
      await row.update({ score, notes, recorded_by: recordedBy });
      written.push(row.toJSON());
    }
    return written;
  },
};

/**
 * Everything one professor needs for their workspace in a single round trip —
 * the frontend's useProfProgramsData otherwise fires five calls and joins them
 * client-side.
 */
export const instructorPrograms = async (instructorId) => {
  const courses = await TrainingCourse.findAll({
    where: { instructor_id: instructorId },
    order: [["start_date", "DESC"]],
    raw: true,
  });
  if (!courses.length) return { courses: [], sessions: [], tests: [] };

  const courseIds = courses.map((c) => c.id);
  const [courseSessions, courseTests] = await Promise.all([
    TrainingSession.findAll({
      where: { course_id: { [Op.in]: courseIds } },
      order: [["scheduled_at", "ASC"]],
      raw: true,
    }),
    TrainingTest.findAll({ where: { course_id: { [Op.in]: courseIds } }, raw: true }),
  ]);
  return { courses, sessions: courseSessions, tests: courseTests };
};
