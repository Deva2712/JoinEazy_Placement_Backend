import { asyncHandler } from "../../middleware/error.middleware.js";
import { service as cohortService } from "../cohort/cohort-service.js";

export const dashboardOverview = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await cohortService.dashboardOverview() });
});
