// src/database/seed-unified.js
import sequelize from "./connection.js";
import "./models.js";
import logger from "../utils/logger.js";
import Department from "../modules/department/department-model.js";
import { User } from "../modules/auth/auth-model.js";
import { Company, RecruiterContact, HiringHistory } from "../modules/companies/companies-model.js";
import { Mou, CampusVisit } from "../modules/mous/mous-model.js";
import { PlacementStudent, StudentPlacementProfile } from "../modules/students/students-model.js";
import { Job, DriveRound } from "../modules/jobs/jobs-model.js";
import { Application, RoundResult } from "../modules/applications/applications-model.js";
import { Offer } from "../modules/offers/offers-model.js";
import { InterviewSlot } from "../modules/interviews/interviews-model.js";
import {
  TrainingCourse, CourseEnrollment, TrainingSession, TrainingAttendance,
  TrainingTest, TrainingScore,
} from "../modules/training/training-model.js";
import { AssessmentTest, AssessmentScore } from "../modules/assessments/assessments-model.js";
import { PlacementTask, OffCampusRecord } from "../modules/tasks/tasks-model.js";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const at = (offset) => new Date(now + offset * day);
const ymd = (offset) => at(offset).toISOString().slice(0, 10);

const findOrCreate = async (model, where, defaults = {}) => {
  const [row, created] = await model.findOrCreate({ where, defaults: { ...where, ...defaults } });
  return { row, created };
};

const parseLpa = (value) => {
  if (!value) return null;
  const nums = String(value).match(/\d+(?:\.\d+)?/g);
  return nums ? Math.max(...nums.map(Number)) : null;
};

const departmentRows = [
  ["CSE", "Computer Science and Engineering"],
  ["ECE", "Electronics and Communication Engineering"],
  ["ME", "Mechanical Engineering"],
  ["CE", "Civil Engineering"],
  ["EEE", "Electrical and Electronics Engineering"],
];

const coreUsers = [
  ["coordinator@mahindrauniversity.edu.in", "coord123", "placement_coordinator", "Placement Coordinator", "CSE"],
  ["robert.aris@mahindrauniversity.edu.in", "hod123", "hod", "Robert Aris", "CSE"],
  ["dean@mahindrauniversity.edu.in", "dean123", "dean", "Dean Office", "Engineering"],
  ["student.demo@mahindrauniversity.edu.in", "Student@123", "student", "Aarav Sharma", "CSE"],
  ["professor.demo@mahindrauniversity.edu.in", "Professor@123", "professor", "Priya Sharma", "CSE"],
  ["arjun.verma@mahindrauniversity.edu.in", "Professor@123", "professor", "Arjun Verma", "ECE"],
  ["meera.iyer@mahindrauniversity.edu.in", "Professor@123", "professor", "Meera Iyer", "ME"],
];

const firstNames = ["Aarav", "Priya", "Aditya", "Sneha", "Kabir", "Ananya", "Rohan", "Isha", "Nikhil", "Meera"];
const lastNames = ["Sharma", "Nair", "Kapoor", "Reddy", "Menon", "Iyer", "Khan", "Patel", "Das", "Rao"];

const rosterSeed = () => {
  const branches = ["CSE", "ECE", "ME", "CE", "EEE"];
  const rows = [{
    email: "student.demo@mahindrauniversity.edu.in",
    name: "Aarav Sharma",
    rollNo: "22CSE001",
    branch: "CSE",
    cgpa: 8.7,
    backlogs: 0,
    placementStatus: "Placed",
  }];
  let n = 2;
  for (const branch of branches) {
    for (let i = 0; i < 8; i += 1) {
      const rollNo = `22${branch}${String(n).padStart(3, "0")}`;
      rows.push({
        email: `${rollNo.toLowerCase()}@mahindrauniversity.edu.in`,
        name: `${firstNames[(n + i) % firstNames.length]} ${lastNames[(n + branch.length) % lastNames.length]}`,
        rollNo,
        branch,
        cgpa: Math.round((6.4 + ((n * 7) % 31) / 10) * 100) / 100,
        backlogs: n % 9 === 0 ? 2 : n % 5 === 0 ? 1 : 0,
        placementStatus: n % 7 === 0 ? "Not Placed" : n % 6 === 0 ? "Placed" : "In Process",
      });
      n += 1;
    }
  }
  return rows.slice(0, 41);
};

const companies = [
  ["Google", "google.com", "Technology", "Tier 1", "Active", "Premium Partner", "2019", "Low", null, true],
  ["Microsoft", "microsoft.com", "Technology", "Tier 1", "Active", "Strategic Partner", "2020", "Low", null, true],
  ["Amazon", "amazon.com", "E-Commerce", "Tier 1", "Active", "Active Recruiter", "2021", "Medium", null, true],
  ["Deloitte", "deloitte.com", "Consulting", "Tier 2", "Active", "Standard Recruiter", "2022", "Low", null, true],
  ["NVIDIA", "nvidia.com", "Semiconductors", "Tier 1", "Active", "Strategic Partner", "2023", "Low", null, true],
  ["Larsen and Toubro", "larsentoubro.com", "Infrastructure", "Tier 2", "Active", "Active Recruiter", "2021", "Low", null, true],
  ["Tata Motors", "tatamotors.com", "Automotive", "Tier 2", "Inactive", "Standard Recruiter", "2018", "Medium", null, true],
  ["Infosys", "infosys.com", "IT Services", "Tier 3", "Active", "Standard Recruiter", "2024", "Low", null, true],
  ["Flipkart", "flipkart.com", "E-Commerce", "Tier 2", "Active", "Active Recruiter", "2020", "Medium", null, true],
  ["Legacy Risk Labs", "legacyrisklabs.example", "Fintech", "Tier 3", "Blacklisted", "Standard Recruiter", "2017", "High", "Repeated offer revocations", false],
];

const jobRows = [
  ["google.com", "SDE I", "Placement", "32 LPA", "Applications open", ["CSE"], 8.0, 0, 20],
  ["microsoft.com", "Software Engineer", "Placement", "28 LPA", "Assessment", ["CSE", "ECE"], 7.5, 0, 18],
  ["amazon.com", "Operations Analyst", "Placement", "16 LPA", "Interviews", ["ME", "EEE"], 7.0, 1, 25],
  ["deloitte.com", "Technology Analyst", "Placement", "11 LPA", "Applications open", ["CSE", "ECE", "EEE"], 6.8, 1, 30],
  ["nvidia.com", "AI Systems Intern", "Internship", "80000/month", "Applications open", ["CSE", "ECE"], 8.5, 0, 8],
  ["larsentoubro.com", "Graduate Engineer Trainee", "Placement", "9 LPA", "Offered", ["ME", "CE", "EEE"], 6.5, 2, 35],
  ["infosys.com", "Systems Engineer", "Placement", "6.5 LPA", "Applications open", ["CSE", "ECE", "EEE"], 6.0, 2, 60],
  ["flipkart.com", "Product Analyst", "Placement", "18 LPA", "Drive complete", ["CSE"], 7.8, 0, 12],
];

const appStatuses = [
  "Applied", "Shortlisted", "Test Cleared", "Interview Scheduled", "Selected",
  "Rejected", "Offer Received", "Placed", "Assessment", "Assessment Cleared", "Interviewing",
];

export const seedAll = async ({ standalone = true } = {}) => {
  if (standalone) {
    await sequelize.authenticate();
    await sequelize.sync();
  }

  logger.info("Seeding unified placement demo data...");

  const departments = {};
  for (const [code, name] of departmentRows) {
    const { row } = await findOrCreate(Department, { code }, { name, description: `${name} department` });
    departments[code] = row;
  }

  const users = {};
  for (const [email, password, role, name, department] of coreUsers) {
    const { row } = await findOrCreate(User, { email }, {
      password,
      role,
      name,
      department,
      designation: role === "professor" ? "Professor" : role === "hod" ? "Head of Department" : null,
      isActive: true,
    });
    users[email] = row;
  }
  await departments.CSE.update({ hod_id: users["robert.aris@mahindrauniversity.edu.in"].id });

  const roster = {};
  for (const student of rosterSeed()) {
    const { row: user } = await findOrCreate(User, { email: student.email }, {
      password: student.email === "student.demo@mahindrauniversity.edu.in" ? "Student@123" : "Student@123",
      role: "student",
      name: student.name,
      department: student.branch,
      batch: "2022-2026",
      year: 2026,
      isActive: true,
    });
    const { row } = await findOrCreate(PlacementStudent, { rollNo: student.rollNo }, {
      userId: user.id,
      name: student.name,
      email: student.email,
      branch: student.branch,
      school: "Engineering",
      batchYear: 2026,
      cgpa: student.cgpa,
      backlogs: student.backlogs,
      placementStatus: student.placementStatus,
    });
    roster[student.rollNo] = row;
    await findOrCreate(StudentPlacementProfile, { studentId: user.id }, {
      resumeUrl: `https://docs.example/resumes/${student.rollNo}.pdf`,
      linkedinUrl: `https://linkedin.example/${student.rollNo}`,
      githubUrl: `https://github.example/${student.rollNo}`,
      skills: ["JavaScript", "SQL", student.branch],
      projects: [{ title: "Campus placement analytics", url: "https://projects.example/placement" }],
    });
  }

  const companyByWebsite = {};
  for (const [name, website, sector, tier, status, relationship, partnerSince, riskLevel, flagReason, approved] of companies) {
    const { row } = await findOrCreate(Company, { website }, {
      name, sector, tier, status, relationship, partnerSince, riskLevel, flagReason, approved,
      profile: `${name} campus recruitment partner`,
      schools: ["Engineering"],
      engagementScore: status === "Blacklisted" ? 18 : 70 + Math.floor(Math.random() * 20),
    });
    companyByWebsite[website] = row;
    await findOrCreate(RecruiterContact, { companyId: row.id, email: `campus@${website}` }, {
      name: `${name} Campus Team`,
      phone: "+91 98000 00000",
      role: "University Relations",
    });
    for (const year of [2023, 2024, 2025]) {
      await findOrCreate(HiringHistory, { companyId: row.id, year }, {
        studentsPlaced: 2 + ((year + name.length) % 12),
        avgPackage: 6 + ((year + name.length) % 20),
      });
    }
  }

  for (const [idx, company] of Object.values(companyByWebsite).entries()) {
    const statuses = ["Draft", "Active", "Renewal Pending", "Expired", "Terminated"];
    const { row: mou } = await findOrCreate(Mou, { companyId: company.id, type: "Campus Hiring" }, {
      status: statuses[idx % statuses.length],
      startDate: ymd(-365 + idx * 10),
      endDate: ymd(365 + idx * 20),
      rolesCovered: ["Internships", "Full-time"],
      rolesLookingFor: ["SDE", "Analyst", "GET"],
      scope: "Placements, internships, training sessions, and campus visits.",
      notes: "Unified demo MoU",
    });
    await findOrCreate(CampusVisit, { mouId: mou.id, date: ymd(-20 + idx) }, {
      purpose: idx % 2 ? "Technical assessment" : "Pre-placement talk",
    });
  }

  const jobs = {};
  for (const [companyKey, role, type, pkg, status, branches, minCgpa, maxBacklogs, openings] of jobRows) {
    const company = companyByWebsite[companyKey];
    const { row: job } = await findOrCreate(Job, { companyId: company.id, role }, {
      companyName: company.name,
      type,
      location: "Hyderabad",
      package: type === "Internship" ? null : pkg,
      stipend: type === "Internship" ? pkg : null,
      description: `${role} opening at ${company.name}`,
      requirements: ["Resume", "Assessment", "Interview"],
      openings,
      minCgpa,
      branches,
      batchYear: 2026,
      maxBacklogs,
      graduationYear: 2026,
      rounds: "3 (Aptitude -> Technical -> HR)",
      deadline: ymd(20 + openings),
      status,
      createdBy: users["coordinator@mahindrauniversity.edu.in"].id,
    });
    jobs[`${companyKey}:${role}`] = job;
    for (const [i, name] of ["Aptitude", "Technical", "HR"].entries()) {
      await findOrCreate(DriveRound, { jobId: job.id, sequence: i + 1 }, {
        name,
        type: i === 0 ? "Assessment" : "Interview",
        format: i === 0 ? "test-link" : "scheduled",
        category: i === 0 ? "screening" : "interview",
        status: i === 0 && status !== "Applications open" ? "Complete" : "Pending",
      });
    }
  }

  const rosterRows = Object.values(roster);
  const jobList = Object.values(jobs);
  for (let i = 0; i < rosterRows.length; i += 1) {
    const student = rosterRows[i];
    const jobsForStudent = student.rollNo === "22CSE001" ? jobList.slice(0, 3) : [jobList[i % jobList.length]];
    for (const [j, job] of jobsForStudent.entries()) {
      const status = student.rollNo === "22CSE001"
        ? ["Placed", "Assessment", "Shortlisted"][j]
        : appStatuses[(i + j) % appStatuses.length];
      const { row: app } = await findOrCreate(Application, { jobId: job.id, studentId: student.userId }, {
        studentName: student.name,
        studentRoll: student.rollNo,
        status,
        appliedAt: at(-18 + i),
        notes: "Seeded unified application",
      });
      if (j === 0 && i < 15) {
        const round = await DriveRound.findOne({ where: { jobId: job.id, sequence: 1 } });
        if (round) {
          await findOrCreate(RoundResult, { roundId: round.id, studentId: student.userId }, {
            jobId: job.id,
            applicationId: app.id,
            status: i % 4 === 0 ? "Rejected" : "Cleared",
            score: 60 + (i % 35),
            recordedBy: users["coordinator@mahindrauniversity.edu.in"].id,
          });
        }
      }
    }
  }

  const demo = roster["22CSE001"];
  const acceptedJob = jobs["google.com:SDE I"];
  const acceptedApp = await Application.findOne({ where: { jobId: acceptedJob.id, studentId: demo.userId } });
  const offerRows = [
    [demo, acceptedJob, acceptedApp, "Accepted", "32 LPA"],
    [rosterRows[5], jobs["microsoft.com:Software Engineer"], null, "Pending", "28 LPA"],
    [rosterRows[10], jobs["larsentoubro.com:Graduate Engineer Trainee"], null, "Accepted", "9 LPA"],
    [rosterRows[15], jobs["amazon.com:Operations Analyst"], null, "Rejected", "16 LPA"],
  ];
  for (const [student, job, app, status, ctc] of offerRows) {
    const { row: offer } = await findOrCreate(Offer, { studentId: student.userId, companyId: job.companyId, role: job.role }, {
      applicationId: app?.id ?? null,
      jobId: job.id,
      studentName: student.name,
      studentRollNo: student.rollNo,
      studentBranch: student.branch,
      companyName: job.companyName,
      ctc,
      ctcValue: parseLpa(ctc),
      joiningDate: ymd(90),
      location: job.location,
      sector: companyByWebsite[companies.find((c) => c[0] === job.companyName)?.[1]]?.sector ?? null,
      ppo: false,
      offCampus: false,
      status,
      acceptedAt: status === "Accepted" ? at(-2) : null,
    });
    if (status === "Accepted") {
      await student.update({
        placementStatus: "Placed",
        placedCompany: offer.companyName,
        placedRole: offer.role,
        placedPackage: offer.ctcValue,
        sector: offer.sector,
      });
    }
  }

  for (const [i, student] of rosterRows.slice(2, 8).entries()) {
    await findOrCreate(OffCampusRecord, { studentId: student.userId, companyName: `Startup ${i + 1}`, role: "Software Intern" }, {
      studentName: student.name,
      studentRollNo: student.rollNo,
      studentBranch: student.branch,
      ctc: i % 2 ? "12 LPA" : "45000/month",
      ctcValue: i % 2 ? 12 : null,
      location: "Remote",
      sector: "Technology",
      offerDate: ymd(-12 + i),
      status: i % 3 ? "Verified" : "Pending verification",
      verified: i % 3 !== 0,
      verifiedBy: users["coordinator@mahindrauniversity.edu.in"].id,
      type: i % 2 ? "Full-time (off-campus)" : "Internship",
      source: "Self-sourced",
    });
  }

  for (const [idx, job] of jobList.slice(0, 4).entries()) {
    const { row: test } = await findOrCreate(AssessmentTest, { job_id: job.id, title: `${job.companyName} Assessment` }, {
      url: `https://assessment.example/${idx}`,
      total_marks: 100,
      cutoff: 65,
      scheduled_at: at(3 + idx),
      duration_mins: 90,
      status: "Scheduled",
    });
    for (const student of rosterRows.slice(idx * 5, idx * 5 + 8)) {
      const score = 55 + ((student.rollNo.charCodeAt(5) + idx) % 40);
      await findOrCreate(AssessmentScore, { test_id: test.id, student_id: student.userId }, {
        score,
        percentile: score,
        result: score >= 65 ? "Cleared" : "Not cleared",
        attempted_at: at(-idx),
      });
    }
  }

  const professors = [
    users["professor.demo@mahindrauniversity.edu.in"],
    users["arjun.verma@mahindrauniversity.edu.in"],
    users["meera.iyer@mahindrauniversity.edu.in"],
  ];
  const courseRows = [
    ["Placement Readiness Lab", "CSE", professors[0]],
    ["Interview Communication", "ECE", professors[1]],
    ["Aptitude Accelerator", "ME", professors[2]],
  ];
  for (const [name, branch, professor] of courseRows) {
    const { row: course } = await findOrCreate(TrainingCourse, { name }, {
      description: `${name} for ${branch}`,
      eligibleBranches: [branch, "CSE"],
      eligibleYears: [2026],
      minCgpa: 6,
      capacity: 60,
      startDate: ymd(-30),
      endDate: ymd(60),
      instructorIds: [professor.id],
      defaultInstructor: professor.name,
      status: "Running",
    });
    const students = branch === "CSE" ? rosterRows.slice(0, 14) : rosterRows.filter((s) => [branch, "CSE"].includes(s.branch)).slice(0, 12);
    for (const student of students) {
      await findOrCreate(CourseEnrollment, { courseId: course.id, studentId: student.userId }, { status: "Enrolled" });
    }
    const { row: session } = await findOrCreate(TrainingSession, { courseId: course.id, title: `${name} Session 1` }, {
      type: "Training",
      category: name,
      instructor: professor.name,
      instructorId: professor.id,
      date: at(2),
      durationMins: 90,
      capacity: 60,
      venue: "Seminar Hall A",
      mode: "Offline",
      eligibleBranches: [branch, "CSE"],
      status: "Scheduled",
    });
    for (const student of students.slice(0, 8)) {
      await findOrCreate(TrainingAttendance, { sessionId: session.id, studentId: student.userId }, {
        studentRollNo: student.rollNo,
        registered: true,
        present: student.rollNo !== "22CSE001" ? true : null,
        markedBy: professor.id,
      });
    }
    const { row: trainingTest } = await findOrCreate(TrainingTest, { courseId: course.id, title: `${name} Test 1` }, {
      category: name,
      testNumber: 1,
      instructorId: professor.id,
      testLink: "https://training.example/test",
      maxScore: 100,
      date: ymd(7),
    });
    for (const student of students.slice(0, 8)) {
      await findOrCreate(TrainingScore, { testId: trainingTest.id, studentId: student.userId }, {
        studentRollNo: student.rollNo,
        score: 60 + (student.rollNo.charCodeAt(6) % 35),
        recordedAt: at(-1),
      });
    }
  }

  for (const [i, app] of (await Application.findAll({ limit: 8, order: [["appliedAt", "ASC"]] })).entries()) {
    await findOrCreate(InterviewSlot, { applicationId: app.id, round: 1 }, {
      jobId: app.jobId,
      studentId: app.studentId,
      studentName: app.studentName,
      studentRollNo: app.studentRoll,
      type: "Technical",
      scheduledAt: at(5 + i),
      durationMins: 45,
      mode: i % 2 ? "Online" : "Offline",
      location: i % 2 ? null : "Interview Room 2",
      link: i % 2 ? "https://meet.example/interview" : null,
      panelMembers: ["Prof. Priya Sharma", "Recruiter Panel"],
      status: i % 3 === 0 ? "Completed" : "Scheduled",
    });
  }

  const taskRows = [
    ["Confirm Google interview panels", "job", acceptedJob.id, "High"],
    ["Collect Microsoft assessment results", "job", jobs["microsoft.com:Software Engineer"].id, "Normal"],
    ["Review blacklisted company note", "company", companyByWebsite["legacyrisklabs.example"].id, "Urgent"],
    ["Publish training attendance", "student", demo.userId, "Normal"],
  ];
  for (const [title, related_type, related_id, priority] of taskRows) {
    await findOrCreate(PlacementTask, { title }, {
      description: `${title} follow-up`,
      related_type,
      related_id,
      assignedTo: users["coordinator@mahindrauniversity.edu.in"].id,
      createdBy: users["coordinator@mahindrauniversity.edu.in"].id,
      due_date: ymd(7),
      priority,
      status: "Open",
    });
  }

  logger.info("Unified placement seed complete.");
};

const isCli = process.argv[1] && process.argv[1].endsWith("seed-unified.js");
if (isCli) {
  seedAll()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error(`Seed failed: ${err.message}`);
      process.exit(1);
    });
}
