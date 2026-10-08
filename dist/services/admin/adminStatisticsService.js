"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStatisticsService = void 0;
const client_1 = require("../../prisma/client");
exports.adminStatisticsService = {
    async revenue() {
        // Total paid (and refunded are not subtracted in this MVP snapshot).
        const paidSum = await client_1.prisma.payment.aggregate({
            where: { status: "PAID" },
            _sum: { amount: true },
        });
        return {
            paidAmount: paidSum._sum.amount ?? 0,
        };
    },
    async orders() {
        const grouped = await client_1.prisma.order.groupBy({
            by: ["status"],
            _count: true,
        });
        return grouped;
    },
    async shipments() {
        const grouped = await client_1.prisma.shipmentGroup.groupBy({
            by: ["status"],
            _count: true,
        });
        return grouped;
    },
    async farmers() {
        const grouped = await client_1.prisma.farmerProfile.groupBy({
            by: ["status"],
            _count: true,
        });
        return grouped;
    },
    async topProducts() {
        // “Top products” defined by total shipped lineTotal across all shipment items.
        const rows = await client_1.prisma.shipmentItem.groupBy({
            by: ["productId"],
            _sum: { lineTotal: true },
            orderBy: { _sum: { lineTotal: "desc" } },
            take: 10,
        });
        const productIds = rows.map((r) => r.productId);
        const products = await client_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, productName: true, farmerProfileId: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        return rows.map((r) => ({
            productId: r.productId,
            productName: productMap.get(r.productId)?.productName ?? null,
            farmerProfileId: productMap.get(r.productId)?.farmerProfileId ?? null,
            shippedValue: r._sum.lineTotal ?? 0,
        }));
    },
};
//# sourceMappingURL=adminStatisticsService.js.map