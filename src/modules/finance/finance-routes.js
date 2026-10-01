import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { overview, fees, history, receipts, dueReminders, pay, downloadReceipt } from "./finance-controller.js";

const router = express.Router();

router.get("/overview", protect, overview);
router.get("/fees", protect, fees);
router.get("/history", protect, history);
router.get("/receipts", protect, receipts);
router.get("/due-reminders", protect, dueReminders);
router.post("/pay", protect, pay);
router.get("/receipts/:receiptId/download", protect, downloadReceipt);

export default router;