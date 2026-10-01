import { getOverview, getFees, getHistory, getReceipts, getDueReminders, makePayment } from "./finance-service.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const overview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getOverview(req.user.id)) });
});
export const fees = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getFees(req.user.id)) });
});
export const history = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getHistory(req.user.id)) });
});
export const receipts = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getReceipts(req.user.id)) });
});
export const dueReminders = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await getDueReminders(req.user.id)) });
});
export const pay = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, ...(await makePayment(req.user.id, req.body)) });
});
export const downloadReceipt = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, url: null, message: "Receipt download not configured" });
});