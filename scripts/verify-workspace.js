import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.VERIFY_BASE_URL || "http://localhost:8013/api/v1";
const token = jwt.sign({
  id: "verify-placement-coordinator",
  email: "coordinator@mahindrauniversity.edu.in",
  name: "Priya Sharma",
  role: "placement_coordinator",
}, process.env.JWT_SECRET, { expiresIn: "1h" });

const curl = async (method, endpoint, body) => {
  const args = [
    "-s",
    "-X", method,
    `${baseUrl}${endpoint}`,
    "-H", `Authorization: Bearer ${token}`,
    "-H", "Content-Type: application/json",
  ];
  if (body !== undefined) args.push("--data", JSON.stringify(body));
  const { stdout } = await execFileAsync("curl", args, { maxBuffer: 1024 * 1024 * 10 });
  const json = JSON.parse(stdout);
  if (json.success === false) throw new Error(`${method} ${endpoint}: ${json.message || json.error}`);
  return json.data ?? json;
};

const assert = (condition, label) => {
  if (!condition) throw new Error(`Shape check failed: ${label}`);
};

const record = (results, module, endpoint) => results.push({ module, endpoint, status: "PASS" });

const run = async () => {
  const results = [];

  const payroll = await curl("GET", "/payroll/history");
  assert(Array.isArray(payroll) && payroll[0]?.breakdown?.deductions, "payroll history");
  record(results, "Payroll", "GET /payroll/history");
  const breakdown = await curl("GET", "/payroll/breakdown");
  assert(breakdown?.attendance && breakdown?.deductions, "payroll breakdown");
  record(results, "Payroll", "GET /payroll/breakdown");
  const payslip = await curl("GET", `/payroll/download/${payroll[0].id}`);
  assert(payslip?.success === true, "payroll download");
  record(results, "Payroll", "GET /payroll/download/:id");

  const leaves = await curl("GET", "/leaves/applications");
  assert(Array.isArray(leaves.applications) && Array.isArray(leaves.substitutionRequests), "leave overview");
  record(results, "Leave", "GET /leaves/applications");
  const createdLeave = await curl("POST", "/leaves/apply", {
    leaveType: "Casual Leave",
    fromDate: "2026-09-20",
    toDate: "2026-09-20",
    courseName: "Placement Lab",
    roomNumber: "B-204",
    timings: { startTime: "10:00", endTime: "12:00" },
    reason: "Verification walkthrough",
    replacementFaculty: "Prof. Arjun Verma",
    substitutionStatus: "Pending",
    status: "Pending",
    appliedAt: new Date().toISOString(),
    leaveApproval: { HoD: { status: "Pending", remark: null }, HR: { status: "Pending", remark: null } },
  });
  assert(createdLeave?.id, "leave create");
  record(results, "Leave", "POST /leaves/apply");
  await curl("POST", `/leaves/update/${createdLeave.id}`, { note: "Updated through verification", previousVersion: createdLeave });
  record(results, "Leave", "POST /leaves/update/:id");
  await curl("POST", `/leaves/approve/${createdLeave.id}`, { role: "HoD", action: "Approved", remark: "Verified" });
  record(results, "Leave", "POST /leaves/approve/:id");
  await curl("POST", `/leaves/substitutions/${leaves.substitutionRequests[0].id}`, { action: "Accepted" });
  record(results, "Leave", "POST /leaves/substitutions/:id");

  const dashboard = await curl("GET", "/user/dashboard-overview");
  assert(Array.isArray(dashboard.createdCohorts) && dashboard.createdCohorts[0]?.id, "dashboard overview");
  record(results, "User", "GET /user/dashboard-overview");

  const schedule = await curl("GET", "/professor/schedule");
  assert(schedule.schedule?.officeHours && Array.isArray(schedule.meetingRequests), "schedule overview");
  record(results, "Schedule", "GET /professor/schedule");
  await curl("PUT", "/professor/schedule", { officeHours: schedule.schedule.officeHours, timetable: schedule.schedule.timetable });
  record(results, "Schedule", "PUT /professor/schedule");
  await curl("POST", "/professor/meetings", {
    title: "Verification sync",
    date: "2026-09-22",
    startTime: "12:00",
    endTime: "12:30",
    location: "Placement Office",
    attendees: ["verify@example.com"],
    type: "Internal",
    description: "Created by endpoint verification",
  });
  record(results, "Schedule", "POST /professor/meetings");
  const meetingId = schedule.meetingRequests[0].id;
  await curl("POST", `/professor/meetings/${meetingId}/accept`, { venue: "Placement Office", notes: "Verified" });
  record(results, "Schedule", "POST /professor/meetings/:id/accept");
  await curl("POST", `/professor/meetings/${meetingId}/reject`, { reason: "Verification state change" });
  record(results, "Schedule", "POST /professor/meetings/:id/reject");
  await curl("POST", `/professor/meetings/${meetingId}/reschedule`, { newDateTime: "2026-09-23T10:00:00.000Z", reason: "Verification" });
  record(results, "Schedule", "POST /professor/meetings/:id/reschedule");

  const assets = await curl("GET", "/assets/list");
  assert(Array.isArray(assets) && assets[0]?.availableCount !== undefined, "assets list");
  record(results, "Assets", "GET /assets/list");
  const assetRequests = await curl("GET", "/assets/requests");
  assert(Array.isArray(assetRequests.requests) && Array.isArray(assetRequests.admins), "asset requests");
  record(results, "Assets", "GET /assets/requests");
  const createdAssetRequest = await curl("POST", "/assets/requests", {
    assetId: assets[0].id,
    quantity: 1,
    purpose: "Verification booking",
    fromDate: "2026-09-24",
    toDate: "2026-09-24",
    cohortId: dashboard.createdCohorts[0].id,
  });
  record(results, "Assets", "POST /assets/requests");
  await curl("PUT", `/assets/requests/${createdAssetRequest.id}`, { ...createdAssetRequest, quantity: 2 });
  record(results, "Assets", "PUT /assets/requests/:id");

  const maintenance = await curl("GET", "/maintenance/my-requests");
  assert(Array.isArray(maintenance.requests) && Array.isArray(maintenance.issueTypes), "maintenance overview");
  record(results, "Maintenance", "GET /maintenance/my-requests");
  const createdMaintenance = await curl("POST", "/maintenance/requests", {
    title: "Verification light check",
    category: "Facilities",
    issueType: "Electrical",
    location: "Placement Office",
    description: "Created by endpoint verification",
    priority: "Low",
    submittedBy: "Priya Sharma",
    submittedByUserId: "verify-placement-coordinator",
    status: "Open",
    createdAt: new Date().toISOString(),
  });
  record(results, "Maintenance", "POST /maintenance/requests");
  await curl("PATCH", `/maintenance/requests/${createdMaintenance.id}/status`, { status: "Resolved", adminRemarks: "Verified" });
  record(results, "Maintenance", "PATCH /maintenance/requests/:id/status");

  const expenses = await curl("GET", "/expenses/list");
  assert(Array.isArray(expenses.expenses.expenses) && Array.isArray(expenses.expenses.financeAdmins), "expenses list");
  record(results, "Expenses", "GET /expenses/list");
  const createdExpense = await curl("POST", "/expenses/create", {
    title: "Verification expense",
    category: "Training",
    amount: 1000,
    amount_spent: 950,
    description: "Created by endpoint verification",
    status: "Pending",
  });
  record(results, "Expenses", "POST /expenses/create");
  await curl("PATCH", `/expenses/${createdExpense.id}/update`, { title: "Verification expense updated", category: "Training", amount: 1000, description: "Updated", status: "Approved", previousVersion: createdExpense });
  record(results, "Expenses", "PATCH /expenses/:id/update");
  await curl("DELETE", `/expenses/${createdExpense.id}`);
  record(results, "Expenses", "DELETE /expenses/:id");

  const advances = await curl("GET", "/advances/list");
  assert(Array.isArray(advances.advances.advances) && Array.isArray(advances.advances.advanceAdmins), "advances list");
  record(results, "Advances", "GET /advances/list");
  const createdAdvance = await curl("POST", "/advances/create", {
    title: "Verification advance",
    category: "Transport",
    amount: 1500,
    amount_requested: 1500,
    description: "Created by endpoint verification",
    status: "Pending",
  });
  record(results, "Advances", "POST /advances/create");
  await curl("PATCH", `/advances/${createdAdvance.id}/update`, { title: "Verification advance updated", category: "Transport", amount: 1500, description: "Updated", status: "Approved", previousVersion: createdAdvance });
  record(results, "Advances", "PATCH /advances/:id/update");
  await curl("DELETE", `/advances/${createdAdvance.id}`);
  record(results, "Advances", "DELETE /advances/:id");

  const bulletins = await curl("GET", "/bulletins");
  assert(Array.isArray(bulletins) && bulletins[0]?.is_pinned !== undefined, "bulletins list");
  record(results, "Bulletins", "GET /bulletins");
  const createdBulletin = await curl("POST", "/bulletins", {
    title: "Verification bulletin",
    content: "Created by endpoint verification",
    level: "institution",
    priority: "Normal",
    is_pinned: false,
    category: "Verification",
  });
  record(results, "Bulletins", "POST /bulletins");
  await curl("DELETE", `/bulletins/${createdBulletin.id}`);
  record(results, "Bulletins", "DELETE /bulletins/:id");

  const cohortAnnouncements = await curl("GET", `/cohort/${dashboard.createdCohorts[0].id}/announcements`);
  assert(Array.isArray(cohortAnnouncements), "cohort announcements list");
  record(results, "Cohort Announcements", "GET /cohort/:cohortId/announcements");
  await curl("POST", `/cohort/${dashboard.createdCohorts[0].id}/announcements`, {
    title: "Verification cohort announcement",
    message: "Created by endpoint verification",
    priority: "Normal",
    attachments: [],
  });
  record(results, "Cohort Announcements", "POST /cohort/:cohortId/announcements");

  for (const item of results) console.log(`${item.status}\t${item.module}\t${item.endpoint}`);
};

run().catch((err) => {
  console.error(`FAIL\t${err.message}`);
  process.exit(1);
});
