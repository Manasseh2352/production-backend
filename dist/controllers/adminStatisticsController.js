"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStatisticsController = void 0;
const adminStatisticsService_1 = require("../services/admin/adminStatisticsService");
exports.adminStatisticsController = {
    async revenue(req, res, next) {
        try {
            const data = await adminStatisticsService_1.adminStatisticsService.revenue();
            return res.json({ ok: true, revenue: data });
        }
        catch (err) {
            next(err);
        }
    },
    async orders(req, res, next) {
        try {
            const data = await adminStatisticsService_1.adminStatisticsService.orders();
            return res.json({ ok: true, orders: data });
        }
        catch (err) {
            next(err);
        }
    },
    async shipments(req, res, next) {
        try {
            const data = await adminStatisticsService_1.adminStatisticsService.shipments();
            return res.json({ ok: true, shipments: data });
        }
        catch (err) {
            next(err);
        }
    },
    async farmers(req, res, next) {
        try {
            const data = await adminStatisticsService_1.adminStatisticsService.farmers();
            return res.json({ ok: true, farmers: data });
        }
        catch (err) {
            next(err);
        }
    },
    async topProducts(req, res, next) {
        try {
            const data = await adminStatisticsService_1.adminStatisticsService.topProducts();
            return res.json({ ok: true, topProducts: data });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminStatisticsController.js.map