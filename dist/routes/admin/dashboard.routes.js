"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminDashboardController_1 = require("../../controllers/adminDashboardController");
exports.adminDashboardRouter = (0, express_1.Router)();
exports.adminDashboardRouter.get("/analytics", adminAuth_1.requireAdmin, adminDashboardController_1.adminDashboardController.analytics);
exports.adminDashboardRouter.get("/statistics", adminAuth_1.requireAdmin, adminDashboardController_1.adminDashboardController.statistics);
//# sourceMappingURL=dashboard.routes.js.map