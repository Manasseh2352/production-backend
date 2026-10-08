import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminStatisticsController } from "../../controllers/adminStatisticsController";

export const adminStatisticsRouter = Router();

adminStatisticsRouter.get(
  "/revenue",
  requireAdmin,
  adminStatisticsController.revenue
);
adminStatisticsRouter.get(
  "/orders",
  requireAdmin,
  adminStatisticsController.orders
);
adminStatisticsRouter.get(
  "/shipments",
  requireAdmin,
  adminStatisticsController.shipments
);
adminStatisticsRouter.get(
  "/farmers",
  requireAdmin,
  adminStatisticsController.farmers
);
adminStatisticsRouter.get(
  "/top-products",
  requireAdmin,
  adminStatisticsController.topProducts
);


