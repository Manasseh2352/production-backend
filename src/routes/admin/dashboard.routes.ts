import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminDashboardController } from "../../controllers/adminDashboardController";

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  "/analytics",
  requireAdmin,
  adminDashboardController.analytics
);
adminDashboardRouter.get(
  "/statistics",
  requireAdmin,
  adminDashboardController.statistics
);

