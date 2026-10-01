import { AttendanceLog, AttendanceRecord } from "./cohort-attendance-model.js";
import CohortMember from "../cohort-members/cohort-members-model.js";

export const getAttendanceLogs = async (cohortId) => {
  const logs = await AttendanceLog.findAll({
    where: { cohort_id: cohortId },
    include: [{ model: AttendanceRecord, as: "records" }],
    order: [["date", "DESC"]],
  });

  const logsMap = { "A": {} };
  let isFinal = false;
  const todayStr = new Date().toISOString().split("T")[0];

  logs.forEach((log) => {
    const presentIds = log.records
      .filter((r) => r.is_present)
      .map((r) => r.student_id);
    logsMap["A"][log.date] = presentIds;

    if (log.date === todayStr && log.status === "final") {
      isFinal = true;
    }
  });

  const members = await CohortMember.findAll({
    where: {
      cohort_id: cohortId,
      role: "student",
    },
  });

  const recordDetailsMap = new Map();
  logs.forEach((log) => {
    log.records.forEach((r) => {
      if (r.roll_number || r.department) {
        recordDetailsMap.set(r.student_id, {
          rollNumber: r.roll_number,
          department: r.department,
        });
      }
    });
  });

  const students = members.map((member) => {
    const enriched = recordDetailsMap.get(member.user_id) || {};
    return {
      id:         member.user_id,
      name:       member.name,
      rollNumber: enriched.rollNumber || "",
      department: enriched.department || member.department || null,
      section:    "A",
    };
  });

  return {
    status: "success",
    data: {
      students,
      logs:     logsMap,
      isFinal,
    },
  };
};
