// src/database/seed.js
//
// Demo dataset for the Placement Coordinator workspace.
//
// Idempotent throughout: every row goes through findOrCreate keyed on a natural
// identifier, so `npm run db:seed` can be re-run any number of times without
// duplicating. Nothing here updates an existing row — edit in the app, re-seed
// freely, your edits survive.
import "dotenv/config";
import sequelize from "./connection.js";
import "./models.js";
import logger from "../utils/logger.js";

import { User } from "../modules/auth/auth-model.js";
import { Company, RecruiterContact, HiringHistory } from "../modules/companies/companies-model.js";
import { Mou, CampusVisit } from "../modules/mous/mous-model.js";
import { Job, DriveRound } from "../modules/jobs/jobs-model.js";
import { Application } from "../modules/applications/applications-model.js";
import { InterviewSlot } from "../modules/interviews/interviews-model.js";
import { Offer } from "../modules/offers/offers-model.js";
import { PlacementStudent } from "../modules/students/students-model.js";
import {
  TrainingInstructor, TrainingCourse, CourseEnrollment,
  TrainingSession, TrainingAttendance, TrainingTest, TrainingScore,
} from "../modules/training/training-model.js";

const day = 86400000;
const at = (offsetDays, hour = 10) => {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const ymd = (offsetDays) => at(offsetDays).toISOString().slice(0, 10);

// ─── Reference data ───────────────────────────────────────────────────────────
// `key` is the stable seed identity, stored as `website`. Keyed on that rather
// than `name` so renaming a company in the app and re-seeding does not insert a
// second row for the same real company, splitting its drives and offers.
const COMPANIES = [
  { key: "google.com",       name: "Google",              sector: "Technology",    tier: "Tier 1", schools: ["Engineering"], profile: "Search, cloud and consumer products." },
  { key: "microsoft.com",    name: "Microsoft",           sector: "Technology",    tier: "Tier 1", schools: ["Engineering"], profile: "Cloud, productivity and devices." },
  { key: "amazon.com",       name: "Amazon",              sector: "E-commerce",    tier: "Tier 1", schools: ["Engineering"], profile: "E-commerce, logistics and AWS." },
  { key: "mckinsey.com",     name: "McKinsey & Company",  sector: "Consulting",    tier: "Tier 1", schools: ["Management"],  profile: "Management consulting." },
  { key: "goldmansachs.com", name: "Goldman Sachs",       sector: "Banking",       tier: "Tier 1", schools: ["Management", "Engineering"], profile: "Investment banking and markets." },
  { key: "flipkart.com",     name: "Flipkart",            sector: "E-commerce",    tier: "Tier 2", schools: ["Engineering"], profile: "Indian e-commerce marketplace." },
  { key: "mahindra.com",     name: "Mahindra & Mahindra", sector: "Manufacturing", tier: "Tier 2", schools: ["Engineering"], profile: "Automotive and farm equipment." },
  { key: "azbpartners.com",  name: "AZB & Partners",      sector: "Legal",         tier: "Tier 1", schools: ["Law"],         profile: "Corporate law firm." },
  { key: "frogdesign.com",   name: "Frog Design",         sector: "Design",        tier: "Tier 2", schools: ["Design"],      profile: "Product and experience design." },
];

// Deliberately not one MoU per company: the Companies tab distinguishes
// partners with a live MoU from those without, and the KPI strip counts
// expiring ones. Max one Active per company — the rule the API enforces.
const MOUS = [
  { company: "google.com",    type: "Both",       status: "Active",          start: -400, end: 420,  roles: ["SDE", "SRE", "Data Analyst"], looking: ["SDE I", "SDE II"], visits: [[-200, "Pre-placement talk"], [40, "Final interviews"]] },
  { company: "microsoft.com", type: "Both",       status: "Active",          start: -380, end: 60,   roles: ["Software Engineer", "PM"],    looking: ["Software Engineer"], visits: [[-150, "Tech talk"]] },
  { company: "amazon.com",    type: "Placement",  status: "Active",          start: -300, end: 25,   roles: ["SDE I", "Ops Manager"],       looking: ["SDE I"], visits: [[20, "Campus drive"]] },
  { company: "mckinsey.com",  type: "Internship", status: "Active",          start: -200, end: 500,  roles: ["Business Analyst"],           looking: ["Business Analyst"], visits: [] },
  { company: "flipkart.com",  type: "Placement",  status: "Renewal Pending", start: -700, end: -10,  roles: ["SDE", "Data Scientist"],      looking: [], visits: [] },
  { company: "mahindra.com",  type: "Both",       status: "Expired",         start: -900, end: -200, roles: ["Graduate Engineer Trainee"],  looking: [], visits: [] },
  // Goldman Sachs, AZB and Frog Design intentionally have no MoU.
];

// [rollNo, name, branch, batchYear, cgpa, backlogs]
// Spread across branches, CGPA bands and batches. 2023–2025 give Analytics real
// year-on-year history; 2026 is the live cycle.
const STUDENTS = [
  ["22CSE001", "Aarav Sharma",   "CSE",           2026, 9.4, 0], ["22CSE002", "Priya Nair",     "CSE",           2026, 9.1, 0],
  ["22CSE003", "Vihaan Kapoor",  "CSE",           2026, 8.7, 0], ["22CSE004", "Diya Sharma",    "CSE",           2026, 8.4, 0],
  ["22CSE005", "Kabir Menon",    "CSE",           2026, 7.9, 1], ["22CSE006", "Ananya Bose",    "CSE",           2026, 7.2, 0],
  ["22CSE007", "Rohan Gupta",    "CSE",           2026, 6.8, 2], ["22CSE008", "Ishita Reddy",   "CSE",           2026, 9.6, 0],
  ["22IT001",  "Rohan Verma",    "IT",            2026, 8.9, 0], ["22IT002",  "Sara Iyer",      "IT",            2026, 8.2, 0],
  ["22IT003",  "Nikhil Rao",     "IT",            2026, 7.5, 0], ["22IT004",  "Meera Pillai",   "IT",            2026, 6.5, 1],
  ["22ECE001", "Arjun Desai",    "ECE",           2026, 8.6, 0], ["22ECE002", "Tara Bose",      "ECE",           2026, 7.7, 0],
  ["22ECE003", "Karan Mehta",    "ECE",           2026, 6.9, 1],
  ["22ME001",  "Manish Yadav",   "ME",            2026, 7.8, 0], ["22ME002",  "Pooja Joshi",    "ME",            2026, 7.1, 0],
  ["22DS001",  "Asha Pillai",    "Data Science",  2026, 8.8, 0], ["22DS002",  "Vikram Singh",   "Data Science",  2026, 8.1, 0],
  ["22MBA001", "Aisha Khanna",   "MBA-Finance",   2026, 8.6, 0], ["22MBA002", "Rohan Malhotra", "MBA-Marketing", 2026, 8.2, 0],
  ["22LAW001", "Ananya Nair",    "BA-LLB",        2026, 8.4, 0], ["22DES001", "Meera Kapoor",   "B.Des-UX",      2026, 8.5, 0],
  ["21CSE001", "Lakshmi Rao",    "CSE",           2025, 9.1, 0], ["21CSE002", "Vivek Reddy",    "CSE",           2025, 8.7, 0],
  ["21IT001",  "Sneha Patil",    "IT",            2025, 7.8, 0], ["21ECE001", "Karthik Nair",   "ECE",           2025, 8.5, 0],
  ["20CSE001", "Aakash Verma",   "CSE",           2024, 7.4, 0], ["20CSE002", "Neha Agarwal",   "CSE",           2024, 8.9, 0],
  ["20IT001",  "Rahul Khanna",   "IT",            2024, 7.6, 0],
  ["19CSE001", "Sanjana Iyer",   "CSE",           2023, 8.3, 0], ["19ME001",  "Deepak Rana",    "ME",            2023, 7.2, 0],
];

// [companyKey, role, type, package, status, minCgpa, branches, deadlineOffset, openings, rounds]
const DRIVES = [
  ["google.com",    "Software Development Engineer", "Full Time",  "₹40 LPA",         "Applications open", 7.5, ["CSE", "IT", "ECE"],             30,  5, ["Online Assessment", "Technical Interview", "HR Interview"]],
  ["microsoft.com", "Software Engineer",             "Full Time",  "₹36 LPA",         "Assessment",        7.0, ["CSE", "IT"],                    12,  8, ["Online Assessment", "Technical Interview", "Hiring Manager"]],
  ["amazon.com",    "SDE I",                         "Full Time",  "₹32 LPA",         "Interviews",        7.0, ["CSE", "IT", "ECE"],              5, 10, ["Online Assessment", "Technical Round 1", "Bar Raiser"]],
  ["mckinsey.com",  "Business Analyst",              "Internship", "₹1,20,000/month", "Offered",           8.0, ["MBA-Finance", "MBA-Marketing"], -3,  3, ["Case Study", "Partner Interview"]],
  ["flipkart.com",  "Data Scientist",                "Full Time",  "₹28 LPA",         "Drive complete",    7.5, ["Data Science", "CSE"],         -20,  4, ["Online Assessment", "Technical Interview"]],
  ["mahindra.com",  "Graduate Engineer Trainee",     "Full Time",  "₹8 LPA",          "Closed",            6.5, ["ME", "ECE"],                   -45, 12, ["Aptitude Test", "Technical Interview"]],
];

// [rollNo, companyKey, status] — deliberately spread across every stage so the
// ATS board and funnel are not one tall column.
const APPLICATIONS = [
  ["22CSE001", "google.com", "Selected"],            ["22CSE002", "google.com", "Interview Scheduled"],
  ["22CSE003", "google.com", "Test Cleared"],        ["22CSE004", "google.com", "Shortlisted"],
  ["22CSE005", "google.com", "Applied"],             ["22CSE006", "google.com", "Rejected"],
  ["22IT001",  "google.com", "Interview Scheduled"], ["22IT002",  "google.com", "Applied"],
  ["22CSE008", "microsoft.com", "Placed"],           ["22CSE001", "microsoft.com", "Rejected"],
  ["22IT003",  "microsoft.com", "Test Cleared"],     ["22ECE001", "microsoft.com", "Shortlisted"],
  ["22IT002",  "microsoft.com", "Applied"],
  ["22CSE003", "amazon.com", "Interview Scheduled"], ["22CSE004", "amazon.com", "Selected"],
  ["22ECE001", "amazon.com", "Applied"],             ["22ECE002", "amazon.com", "Rejected"],
  ["22DS001",  "amazon.com", "Shortlisted"],
  ["22MBA001", "mckinsey.com", "Placed"],            ["22MBA002", "mckinsey.com", "Offer Received"],
  ["22DS002",  "flipkart.com", "Placed"],            ["22DS001",  "flipkart.com", "Rejected"],
  ["22ME001",  "mahindra.com", "Placed"],            ["22ME002",  "mahindra.com", "Rejected"],
];

// [rollNo, companyKey, type, dayOffset, status, notes]
const INTERVIEWS = [
  ["22CSE002", "google.com",    "Technical",       4, "Scheduled", null],
  ["22IT001",  "google.com",    "Technical",       5, "Scheduled", null],
  ["22CSE003", "amazon.com",    "Technical",       2, "Scheduled", null],
  ["22CSE001", "google.com",    "HR",             -6, "Completed", "Strong system design; recommended for offer."],
  ["22CSE008", "microsoft.com", "Hiring Manager", -12, "Completed", "Excellent problem solving. Hire."],
  ["22CSE004", "amazon.com",    "Bar Raiser",     -4, "Completed", "Good depth on DS/Algo. Leaning hire."],
  ["22CSE006", "google.com",    "Technical",      -9, "Completed", "Struggled with DP. Not proceeding."],
];

// [rollNo, companyKey, role, ctc, status, ppo, offCampus]
const OFFERS = [
  ["22CSE008", "microsoft.com",    "Software Engineer",             "₹36 LPA",         "Accepted",  false, false],
  ["22MBA001", "mckinsey.com",     "Business Analyst",              "₹30 LPA",         "Accepted",  true,  false],
  ["22DS002",  "flipkart.com",     "Data Scientist",                "₹28 LPA",         "Accepted",  false, false],
  ["22ME001",  "mahindra.com",     "Graduate Engineer Trainee",     "₹8 LPA",          "Accepted",  false, false],
  ["22DES001", "frogdesign.com",   "Product Designer",              "₹16 LPA",         "Accepted",  false, true],
  ["22LAW001", "azbpartners.com",  "Legal Associate",               "₹18 LPA",         "Accepted",  true,  false],
  ["22CSE001", "google.com",       "Software Development Engineer", "₹40 LPA",         "Pending",   false, false],
  ["22CSE004", "amazon.com",       "SDE I",                         "₹32 LPA",         "Pending",   false, false],
  ["22MBA002", "mckinsey.com",     "Business Analyst",              "₹1,20,000/month", "Pending",   false, false],
  ["22IT004",  "google.com",       "Support Engineer",              "₹12 LPA",         "Rejected",  false, false],
  ["22ECE003", "mahindra.com",     "Graduate Engineer Trainee",     "₹8 LPA",          "Withdrawn", false, false],
  // Off-campus + still Pending, so the Offers tab's off-campus KPI (which counts
  // the ACTIVE pool) is non-zero alongside the accepted off-campus placement.
  ["22CSE007", "flipkart.com",     "Backend Engineer",              "₹14 LPA",         "Pending",   false, true],
  // Past batches — the history Analytics charts year-on-year.
  ["21CSE001", "google.com",       "SWE",                           "₹28 LPA",         "Accepted",  false, false],
  ["21CSE002", "amazon.com",       "SDE I",                         "₹22 LPA",         "Accepted",  false, false],
  ["21IT001",  "flipkart.com",     "SDE",                           "₹18 LPA",         "Accepted",  false, false],
  ["21ECE001", "goldmansachs.com", "Analyst",                       "₹18 LPA",         "Accepted",  false, false],
  ["20CSE001", "mahindra.com",     "Systems Engineer",              "₹7 LPA",          "Accepted",  false, false],
  ["20CSE002", "microsoft.com",    "Software Engineer",             "₹24 LPA",         "Accepted",  false, false],
  ["20IT001",  "amazon.com",       "SDE I",                         "₹20 LPA",         "Accepted",  false, false],
  ["19CSE001", "google.com",       "SWE",                           "₹26 LPA",         "Accepted",  false, false],
  ["19ME001",  "mahindra.com",     "Graduate Engineer Trainee",     "₹6 LPA",          "Accepted",  false, false],
];

const INSTRUCTORS = [
  ["Prof. Arjun Verma",   "arjun.verma@mahindrauniversity.edu.in",    "Computer Science"],
  ["Ms. Anita Krishnan",  "anita.krishnan@mahindrauniversity.edu.in", "Placement Cell"],
  ["Ms. Kavita Rao",      "kavita.rao@mahindrauniversity.edu.in",     "Communication"],
  ["Prof. Sanjay Bansal", "sanjay.bansal@mahindrauniversity.edu.in",  "Mathematics"],
  ["Dr. Rohan Kapoor",    "rohan.kapoor@mahindrauniversity.edu.in",   "Computer Science"],
  ["Prof. Neha Malhotra", "neha.malhotra@mahindrauniversity.edu.in",  "Management"],
  ["Mr. Vinay Joshi",     "vinay.joshi@mahindrauniversity.edu.in",    "Soft Skills"],
  ["Dr. Meera Iyer",      "meera.iyer@mahindrauniversity.edu.in",     "Humanities"],
];

const COURSES = [
  { name: "DSA",           description: "Data structures & algorithms for coding interviews.",     branches: ["CSE", "IT", "Data Science", "ECE"], minCgpa: 7,    capacity: 40, instructor: "Prof. Arjun Verma" },
  { name: "Aptitude",      description: "Quantitative, logical & verbal aptitude for placement tests.", branches: [],              minCgpa: null, capacity: 60, instructor: "Prof. Sanjay Bansal" },
  { name: "Communication", description: "Business communication, GD & interview skills.",           branches: [],                  minCgpa: null, capacity: 50, instructor: "Ms. Kavita Rao" },
  { name: "System Design", description: "Scalable systems design for senior SDE roles.",            branches: ["CSE", "IT"],       minCgpa: 8,    capacity: 25, instructor: "Dr. Rohan Kapoor" },
];

// [course, title, type, dayOffset, mode, venue, instructor]
const SESSIONS = [
  ["DSA",           "Arrays & Hashing",              "Technical",   -21, "Offline", "Lab 2",          "Prof. Arjun Verma"],
  ["DSA",           "Trees & Graphs",                "Technical",   -14, "Offline", "Lab 2",          "Prof. Arjun Verma"],
  ["DSA",           "Dynamic Programming",           "Technical",    -7, "Offline", "Lab 2",          "Dr. Rohan Kapoor"],
  ["DSA",           "Mock Coding Interview",         "Technical",     6, "Offline", "Lab 2",          "Prof. Arjun Verma"],
  ["Aptitude",      "Quantitative Sprint",           "Aptitude",    -18, "Offline", "Seminar Hall A", "Prof. Sanjay Bansal"],
  ["Aptitude",      "Logical Reasoning",             "Aptitude",     -5, "Online",  null,             "Prof. Sanjay Bansal"],
  ["Communication", "Group Discussion: Tech Ethics", "Soft Skills", -10, "Offline", "Seminar Hall B", "Dr. Meera Iyer"],
  ["Communication", "Resume & LinkedIn Clinic",      "Soft Skills",   3, "Online",  null,             "Ms. Kavita Rao"],
  ["System Design", "Designing a URL Shortener",     "Technical",     9, "Offline", "Lab 1",          "Dr. Rohan Kapoor"],
];

// [category, title, maxScore, dayOffset]
const TESTS = [
  ["Aptitude",      "Quantitative Aptitude Sprint", 100, -17],
  ["Aptitude",      "Verbal & Logical Mock",        100,  -4],
  ["DSA",           "DSA Foundations",              100, -13],
  ["DSA",           "DSA Advanced Mock",            100,  -6],
  ["Communication", "GD Evaluation",                 50,  -9],
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
export const seedAll = async ({ standalone = true } = {}) => {
  if (standalone) {
    await sequelize.authenticate();
    await sequelize.sync();
  }
  logger.info("Seeding placement demo data…");

  const n = {};
  const bump = (k) => { n[k] = (n[k] || 0) + 1; };

  // Two coordinator logins. The second matches the frontend's own mock user
  // list, so signing in through the real UI issues a JWT this service accepts.
  for (const c of [
    { email: "coordinator@test.com", password: "password123", first_name: "Test", last_name: "Coordinator" },
    { email: "coordinator@mahindrauniversity.edu.in", password: "coord123", first_name: "Priya", last_name: "Sharma" },
  ]) {
    const [, made] = await User.findOrCreate({ where: { email: c.email }, defaults: { ...c, role: "placement_coordinator" } });
    if (made) bump("users");
  }

  const companyBy = {};
  for (const { key, ...c } of COMPANIES) {
    const [row, made] = await Company.findOrCreate({ where: { website: key }, defaults: { ...c, website: key } });
    companyBy[key] = row;
    if (made) bump("companies");
  }

  // Hiring history drives CompanyCard's "Students placed" and the engagement
  // score; recruiter contacts populate the company detail modal.
  const HIRING = {
    "google.com":       [[2023, 4, 26], [2024, 5, 27], [2025, 6, 28]],
    "microsoft.com":    [[2023, 3, 22], [2024, 4, 24], [2025, 5, 26]],
    "amazon.com":       [[2023, 5, 20], [2024, 6, 21], [2025, 7, 22]],
    "mckinsey.com":     [[2024, 2, 28], [2025, 3, 30]],
    "goldmansachs.com": [[2024, 2, 18], [2025, 2, 19]],
    "flipkart.com":     [[2023, 3, 16], [2024, 4, 18]],
    "mahindra.com":     [[2023, 8, 6],  [2024, 9, 7],  [2025, 10, 8]],
    "azbpartners.com":  [[2025, 2, 18]],
    "frogdesign.com":   [[2025, 1, 16]],
  };
  const CONTACTS = {
    "google.com":       ["Rhea Malhotra", "rhea.malhotra@google.com", "University Recruiter"],
    "microsoft.com":    ["Arjun Sethi",   "arjun.sethi@microsoft.com", "Campus Lead"],
    "amazon.com":       ["Nisha Verma",   "nisha.verma@amazon.com",    "Talent Acquisition"],
    "mckinsey.com":     ["Devika Rao",    "devika.rao@mckinsey.com",   "Recruiting Manager"],
    "goldmansachs.com": ["Kabir Anand",   "kabir.anand@gs.com",        "Campus Recruiter"],
    "flipkart.com":     ["Sneha Kulkarni", "sneha.k@flipkart.com",     "TA Partner"],
    "mahindra.com":     ["Ramesh Pillai", "ramesh.pillai@mahindra.com", "HR Manager"],
    "azbpartners.com":  ["Priya Venkat",  "priya.venkat@azb.com",      "Hiring Partner"],
    "frogdesign.com":   ["Leo Fernandes", "leo.f@frogdesign.com",      "Design Recruiter"],
  };
  for (const [key, years] of Object.entries(HIRING)) {
    const company = companyBy[key];
    for (const [year, placed, avg] of years) {
      const [, made] = await HiringHistory.findOrCreate({
        where: { companyId: company.id, year },
        defaults: { companyId: company.id, year, studentsPlaced: placed, avgPackage: avg },
      });
      if (made) bump("hiringHistory");
    }
    const [name, email, role] = CONTACTS[key];
    const [, madeC] = await RecruiterContact.findOrCreate({
      where: { companyId: company.id, email },
      defaults: { companyId: company.id, name, email, role, phone: "+91 98000 00000" },
    });
    if (madeC) bump("contacts");
  }

  for (const m of MOUS) {
    const company = companyBy[m.company];
    const [mou, made] = await Mou.findOrCreate({
      where: { companyId: company.id, startDate: ymd(m.start) },
      defaults: {
        companyId: company.id, type: m.type, status: m.status,
        startDate: ymd(m.start), endDate: ymd(m.end),
        rolesCovered: m.roles, rolesLookingFor: m.looking,
        documents: [{ name: `${company.name} MoU.pdf`, url: "/docs/mou.pdf" }],
      },
    });
    if (!made) continue;
    bump("mous");
    for (const [off, purpose] of m.visits) {
      await CampusVisit.create({ mouId: mou.id, date: ymd(off), purpose });
    }
  }

  const studentBy = {};
  for (const [rollNo, name, branch, batchYear, cgpa, backlogs] of STUDENTS) {
    const school = branch.startsWith("MBA") ? "Management"
      : branch.includes("LLB") ? "Law"
      : branch.startsWith("B.Des") ? "Design" : "Engineering";
    const [row, made] = await PlacementStudent.findOrCreate({
      where: { rollNo },
      defaults: {
        rollNo, name, branch, batchYear, cgpa, backlogs, school,
        email: `${rollNo.toLowerCase()}@mahindrauniversity.edu.in`,
      },
    });
    studentBy[rollNo] = row;
    if (made) bump("students");
  }

  const driveBy = {};
  for (const [key, role, type, pkg, status, minCgpa, branches, deadline, openings, rounds] of DRIVES) {
    const company = companyBy[key];
    const isIntern = type === "Internship";
    const [job, made] = await Job.findOrCreate({
      where: { role, companyId: company.id },
      defaults: {
        companyId: company.id, companyName: company.name, role, type, status,
        location: "Hyderabad, India",
        package: isIntern ? null : pkg,
        stipend: isIntern ? pkg : null,
        description: `${role} opening at ${company.name}.`,
        requirements: ["Problem solving", "Communication"],
        openings, minCgpa, branches, batchYear: 2026, graduationYear: 2026, maxBacklogs: 0,
        deadline: at(deadline), postedAt: at(deadline - 30),
        rounds: `${rounds.length} (${rounds.join(" → ")})`,
        applicationFormUrl: `https://careers.example/${key}/apply`,
        jdUrl: `https://careers.example/${key}/jd`,
        additionalInfo: "Offer letters issued within 2 weeks of the final round.",
      },
    });
    driveBy[key] = job;
    if (!made) continue;
    bump("drives");
    for (const [i, label] of rounds.entries()) {
      await DriveRound.create({
        jobId: job.id, name: label, sequence: i + 1,
        type: i === 0 ? "assessment" : "interview",
        format: i === 0 ? "test-link" : "scheduled",
        category: i === 0 ? "screening" : "interview",
        config: {},
      });
    }
  }

  const appBy = {};
  for (const [rollNo, key, status] of APPLICATIONS) {
    const student = studentBy[rollNo];
    const job = driveBy[key];
    if (!student || !job) continue;
    const [app, made] = await Application.findOrCreate({
      where: { jobId: job.id, studentId: student.id },
      defaults: {
        jobId: job.id, studentId: student.id, studentName: student.name,
        studentRoll: student.rollNo, status, appliedAt: at(-25),
      },
    });
    appBy[`${rollNo}|${key}`] = app;
    if (made) bump("applications");
  }

  for (const [rollNo, key, type, off, status, notes] of INTERVIEWS) {
    const app = appBy[`${rollNo}|${key}`];
    if (!app) continue;
    const scheduledAt = at(off, 11);
    const [, made] = await InterviewSlot.findOrCreate({
      where: { applicationId: app.id, scheduledAt },
      defaults: {
        applicationId: app.id, jobId: app.jobId, studentId: app.studentId,
        studentName: app.studentName, studentRollNo: app.studentRoll,
        round: 1, type, scheduledAt,
        durationMins: 45, mode: "Online", link: "https://meet.example/interview",
        panelMembers: ["Ms. Anita Krishnan"], status, notes,
      },
    });
    if (made) bump("interviews");
  }

  for (const [rollNo, key, role, ctc, status, ppo, offCampus] of OFFERS) {
    const student = studentBy[rollNo];
    const company = companyBy[key];
    if (!student || !company) continue;
    // Mirrors offers-service.parseCtc: top of a range, null for monthly
    // stipends so package averages stay honest.
    const monthly = /month|\/\s*mo|p\.?m\.?/i.test(ctc);
    const nums = ctc.match(/\d+(?:[.,]\d+)?/g)?.map((s) => Number(s.replace(/,/g, "")));
    const ctcValue = monthly || !nums ? null : Math.max(...nums);
    const [, made] = await Offer.findOrCreate({
      where: { studentId: student.id, companyName: company.name, role },
      defaults: {
        applicationId: appBy[`${rollNo}|${key}`]?.id ?? null,
        studentId: student.id, studentName: student.name,
        studentRollNo: student.rollNo, studentBranch: student.branch,
        companyId: company.id, companyName: company.name, role,
        ctc, ctcValue,
        joiningDate: ymd(60), location: "Hyderabad, India", sector: company.sector,
        ppo, offCampus, status,
        letterUrl: status === "Accepted" ? "/uploads/offer-letter.pdf" : null,
        letterSentAt: status === "Accepted" ? at(-15) : null,
      },
    });
    if (!made) continue;
    bump("offers");
    // An accepted offer is what marks a student Placed — the roster snapshot
    // the Students tab and every placement-% aggregate read.
    if (status === "Accepted") {
      await student.update({
        placementStatus: "Placed", placedCompany: company.name,
        placedRole: role, placedPackage: ctcValue, sector: company.sector,
      });
    }
  }

  const instructorBy = {};
  for (const [name, email, department] of INSTRUCTORS) {
    const [row, made] = await TrainingInstructor.findOrCreate({
      where: { email }, defaults: { name, email, department, role: "professor" },
    });
    instructorBy[name] = row;
    if (made) bump("instructors");
  }

  const courseBy = {};
  for (const c of COURSES) {
    const [row, made] = await TrainingCourse.findOrCreate({
      where: { name: c.name },
      defaults: {
        name: c.name, description: c.description, eligibleBranches: c.branches,
        eligibleYears: [2026], minCgpa: c.minCgpa, capacity: c.capacity,
        startDate: ymd(-30), endDate: ymd(90), status: "Running",
        defaultInstructor: c.instructor,
        instructorIds: instructorBy[c.instructor] ? [instructorBy[c.instructor].id] : [],
      },
    });
    courseBy[c.name] = row;
    if (made) bump("courses");
  }

  // Enrol the current-cycle roster into every course they are eligible for.
  const current = STUDENTS.filter(([, , , year]) => year === 2026);
  for (const course of Object.values(courseBy)) {
    for (const [rollNo, , branch, , cgpa] of current) {
      const branches = course.eligibleBranches || [];
      if (branches.length && !branches.includes(branch)) continue;
      if (course.minCgpa != null && cgpa < course.minCgpa) continue;
      const [, made] = await CourseEnrollment.findOrCreate({
        where: { courseId: course.id, studentId: studentBy[rollNo].id },
        defaults: { courseId: course.id, studentId: studentBy[rollNo].id, enrolledAt: at(-28) },
      });
      if (made) bump("enrollments");
    }
  }

  const rollById = Object.fromEntries(Object.entries(studentBy).map(([roll, s]) => [s.id, roll]));

  for (const [courseName, title, type, off, mode, venue, instructor] of SESSIONS) {
    const course = courseBy[courseName];
    const date = at(off, 14);
    const [session, made] = await TrainingSession.findOrCreate({
      where: { title, date },
      defaults: {
        courseId: course.id, title, type, category: courseName, date,
        instructor, instructorId: instructorBy[instructor]?.id ?? null,
        durationMins: 90, capacity: course.capacity, mode, venue,
        link: mode === "Online" ? "https://meet.example/training" : null,
        eligibleBranches: course.eligibleBranches, minCgpa: course.minCgpa,
        status: off < 0 ? "Completed" : "Scheduled",
      },
    });
    if (!made) continue;
    bump("sessions");

    // Past sessions get a marked register; upcoming ones get registrations with
    // `present` still null, which is the state the register view distinguishes.
    const enrolled = await CourseEnrollment.findAll({ where: { courseId: course.id }, raw: true });
    for (const [i, e] of enrolled.entries()) {
      await TrainingAttendance.findOrCreate({
        where: { sessionId: session.id, studentId: e.studentId },
        defaults: {
          sessionId: session.id, studentId: e.studentId,
          studentRollNo: rollById[e.studentId] ?? null,
          registered: true,
          // Deterministic ~80% attendance — every 5th enrolled student absent.
          present: off < 0 ? i % 5 !== 0 : null,
          notes: off < 0 && i % 5 === 0 ? "Absent — informed" : null,
        },
      });
      bump("attendance");
    }
  }

  for (const [category, title, maxScore, off] of TESTS) {
    const existing = await TrainingTest.count({ where: { category } });
    const [test, made] = await TrainingTest.findOrCreate({
      where: { title },
      defaults: {
        courseId: courseBy[category]?.id ?? null, category, title,
        testNumber: existing + 1, maxScore, date: ymd(off),
        description: `${title} — ${maxScore} marks.`,
        testLink: "https://forms.example/test",
      },
    });
    if (!made) continue;
    bump("tests");

    const enrolled = await CourseEnrollment.findAll({ where: { courseId: test.courseId }, raw: true });
    for (const [i, e] of enrolled.entries()) {
      // Spread scores across a realistic band instead of one flat number.
      const score = Math.round(maxScore * (0.45 + ((i * 37) % 55) / 100));
      await TrainingScore.findOrCreate({
        where: { testId: test.id, studentId: e.studentId },
        defaults: {
          testId: test.id, studentId: e.studentId,
          studentRollNo: rollById[e.studentId] ?? null,
          score, recordedAt: at(off + 1),
          notes: score >= maxScore * 0.9 ? "Top performer" : null,
        },
      });
      bump("scores");
    }
  }

  const summary = Object.entries(n).map(([k, v]) => `${v} ${k}`).join(", ");
  logger.info(summary ? `Seeded: ${summary}.` : "Already seeded — nothing new created.");
  logger.info("Coordinator login: coordinator@mahindrauniversity.edu.in / coord123");
};

// Only self-execute when run as a script (`npm run db:seed`), not when the
// server imports seedAll() for its first-boot auto-seed.
const isCli = process.argv[1] && process.argv[1].endsWith("seed.js");
if (isCli) {
  seedAll()
    .then(() => sequelize.close())
    .catch((err) => {
      logger.error(`Seed failed: ${err.message}`);
      process.exit(1);
    });
}
