"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStatisticsRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminStatisticsController_1 = require("../../controllers/adminStatisticsController");
exports.adminStatisticsRouter = (0, express_1.Router)();
exports.adminStatisticsRouter.get("/revenue", adminAuth_1.requireAdmin, adminStatisticsController_1.adminStatisticsController.revenue);
exports.adminStatisticsRouter.get("/orders", adminAuth_1.requireAdmin, adminStatisticsController_1.adminStatisticsController.orders);
exports.adminStatisticsRouter.get("/shipments", adminAuth_1.requireAdmin, adminStatisticsController_1.adminStatisticsController.shipments);
exports.adminStatisticsRouter.get("/farmers", adminAuth_1.requireAdmin, adminStatisticsController_1.adminStatisticsController.farmers);
exports.adminStatisticsRouter.get("/top-products", adminAuth_1.requireAdmin, adminStatisticsController_1.adminStatisticsController.topProducts);
//# sourceMappingURL=statistics.routes.js.map