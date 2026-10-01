import { asyncHandler } from "../../middleware/error.middleware.js";
import * as service from "./cohort-attendance-service.js";

export const getAttendanceLogs = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const result = await service.getAttendanceLogs(cohortId);
  res.status(200).json(result);
});
