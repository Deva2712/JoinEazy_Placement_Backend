import { RegistrarRequest, LorRequest } from "./registrar-model.js";

// ─── Registrar ─────────────────────────────────────────────────────────────────
export const getOverview = async (userId) => {
  const requests = await RegistrarRequest.findAll({ where: { student_id: userId } });
  const pending = requests.filter(r => r.status === "pending").length;
  const ready = requests.filter(r => r.status === "ready").length;
  return { overview: { total: requests.length, pending, ready }, requests, adminSubmittedDocs: [] };
};

export const getRequests = async (userId) => {
  const requests = await RegistrarRequest.findAll({ where: { student_id: userId }, order: [["createdAt","DESC"]] });
  return { requests };
};

export const createRequest = async (userId, data) => {
  const request = await RegistrarRequest.create({ student_id: userId, ...data });
  return { request };
};

export const cancelRequest = async (requestId, userId) => {
  const request = await RegistrarRequest.findOne({ where: { id: requestId, student_id: userId } });
  if (!request) { const err = new Error("Request not found"); err.statusCode = 404; throw err; }
  await request.update({ status: "rejected" });
  return { request };
};

// ─── LOR ──────────────────────────────────────────────────────────────────────
export const getLorRequests = async (userId) => {
  const requests = await LorRequest.findAll({ 
    where: { student_id: userId }, 
    order: [["createdAt","DESC"]] 
  });
  return requests.map(r => r.toJSON()); // array directly
};

export const createLorRequest = async (userId, data) => {
  const request = await LorRequest.create({ student_id: userId, ...data });
  return request.toJSON();
};

export const cancelLorRequest = async (requestId, userId) => {
  const request = await LorRequest.findOne({ where: { id: requestId, student_id: userId } });
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }
  await request.destroy();
  return { message: "LOR request cancelled" };
};

export const scheduleLorMeeting = async (requestId, userId, meetingTime) => {
  const request = await LorRequest.findOne({ where: { id: requestId, student_id: userId } });
  if (!request) { const err = new Error("LOR request not found"); err.statusCode = 404; throw err; }
  await request.update({ meeting_time: meetingTime });
  return request.toJSON();
};