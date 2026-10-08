"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardController = void 0;
const adminAnalyticsService_1 = require("../services/admin/adminAnalyticsService");
exports.adminDashboardController = {
    async analytics(req, res, next) {
        try {
            const data = await adminAnalyticsService_1.adminAnalyticsService.getAnalytics();
            return res.json({ ok: true, analytics: data });
        }
        catch (err) {
            next(err);
        }
    },
    async statistics(req, res, next) {
        try {
            const data = await adminAnalyticsService_1.adminAnalyticsService.getStatistics();
            return res.json({ ok: true, statistics: data });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminDashboardController.js.map