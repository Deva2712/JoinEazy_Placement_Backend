import { Fee, Payment, Receipt } from "./finance-model.js";

export const getOverview = async (userId) => {
  const fees = await Fee.findAll({ where: { student_id: userId } });
  const paymentHistory = await Payment.findAll({ where: { student_id: userId } });
  const receipts = await Receipt.findAll({ where: { student_id: userId } });
  const dueReminders = fees.filter(f => f.status !== "paid" && new Date(f.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  return { fees, paymentHistory, receipts, dueReminders };
};

export const getFees = async (userId) => {
  const fees = await Fee.findAll({ where: { student_id: userId } });
  return { fees };
};

export const getHistory = async (userId) => {
  const paymentHistory = await Payment.findAll({ where: { student_id: userId } });
  return { paymentHistory };
};

export const getReceipts = async (userId) => {
  const receipts = await Receipt.findAll({ where: { student_id: userId } });
  return { receipts };
};

export const getDueReminders = async (userId) => {
  const fees = await Fee.findAll({ where: { student_id: userId } });
  const dueReminders = fees.filter(f => f.status !== "paid");
  return { dueReminders };
};

export const makePayment = async (userId, payload) => {
  const { feeId, mode, amount } = payload;
  const fee = await Fee.findByPk(feeId);
  if (!fee) {
    const err = new Error("Fee not found"); err.statusCode = 404; throw err;
  }
  const payment = await Payment.create({ student_id: userId, fee_id: feeId, amount, mode });
  const newPaid = fee.paid_amount + amount;
  await fee.update({ paid_amount: newPaid, status: newPaid >= fee.amount ? "paid" : "partial" });
  const receipt = await Receipt.create({ student_id: userId, payment_id: payment.id });
  return { payment, receipt };
};