"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalyticsService = void 0;
const client_1 = require("../../prisma/client");
exports.adminAnalyticsService = {
    async getAnalytics() {
        // Lightweight “dashboard analytics” snapshot.
        const [activeFarmers, activeBuyers, activeProducts, recentOrdersCount] = await Promise.all([
            client_1.prisma.farmerProfile.count({ where: { status: "ACTIVE" } }),
            client_1.prisma.buyerProfile.count({ where: { status: "ACTIVE" } }),
            client_1.prisma.product.count({ where: { status: "ACTIVE" } }),
            client_1.prisma.order.count({
                where: {
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        return {
            activeFarmers,
            activeBuyers,
            activeProducts,
            recentOrdersCount,
        };
    },
    async getStatistics() {
        const [orders, shipments, payments] = await Promise.all([
            client_1.prisma.order.count(),
            client_1.prisma.shipmentGroup.count(),
            client_1.prisma.payment.count(),
        ]);
        return { orders, shipments, payments };
    },
};
//# sourceMappingURL=adminAnalyticsService.js.map