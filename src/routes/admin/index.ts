import { Router } from "express";

import { adminDashboardRouter } from "./dashboard.routes";
import { adminUsersRouter } from "./users.routes";
import { adminFarmersRouter } from "./farmers.routes";
import { adminBuyersRouter } from "./buyers.routes";
import { adminProductsRouter } from "./products.routes";
import { adminOrdersRouter } from "./orders.routes";
import { adminShipmentsRouter } from "./shipments.routes";
import { adminPaymentsRouter } from "./payments.routes";
import { adminStatisticsRouter } from "./statistics.routes";

export const adminIndexRouter = Router();

adminIndexRouter.use("/dashboard", adminDashboardRouter);
adminIndexRouter.use("/users", adminUsersRouter);
adminIndexRouter.use("/farmers", adminFarmersRouter);
adminIndexRouter.use("/buyers", adminBuyersRouter);
adminIndexRouter.use("/products", adminProductsRouter);
adminIndexRouter.use("/orders", adminOrdersRouter);
adminIndexRouter.use("/shipments", adminShipmentsRouter);
adminIndexRouter.use("/payments", adminPaymentsRouter);
adminIndexRouter.use("/statistics", adminStatisticsRouter);


