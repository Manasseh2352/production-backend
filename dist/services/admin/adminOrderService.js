"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminOrderService = {
    async listOrders(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (query?.buyerId) {
            where.buyerProfileId = query.buyerId;
        }
        if (q) {
            where.OR = [
                { id: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
            ];
        }
        const total = client_1.prisma.order.count({ where });
        const rows = client_1.prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                status: true,
                buyerProfileId: true,
                currency: true,
                subtotalAmount: true,
                taxAmount: true,
                shippingAmount: true,
                totalAmount: true,
                createdAt: true,
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminOrderService.js.map