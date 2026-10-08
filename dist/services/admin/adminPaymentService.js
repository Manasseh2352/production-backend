"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminPaymentService = {
    async listPayments(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (query?.orderId)
            where.orderId = query.orderId;
        if (query?.method)
            where.method = query.method;
        if (q) {
            where.OR = [
                { id: { contains: q, mode: "insensitive" } },
                { providerPaymentId: { contains: q, mode: "insensitive" } },
            ];
        }
        const total = client_1.prisma.payment.count({ where });
        const rows = client_1.prisma.payment.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                orderId: true,
                status: true,
                method: true,
                currency: true,
                amount: true,
                provider: true,
                providerPaymentId: true,
                authorizedAt: true,
                paidAt: true,
                failedAt: true,
                refundedAt: true,
                createdAt: true,
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminPaymentService.js.map