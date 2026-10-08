"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBuyerService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminBuyerService = {
    async listBuyers(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (q) {
            where.OR = [
                { displayName: { contains: q, mode: "insensitive" } },
                { user: { email: { contains: q, mode: "insensitive" } } },
                { user: { phone: { contains: q, mode: "insensitive" } } },
            ];
        }
        const total = client_1.prisma.buyerProfile.count({ where });
        const rows = client_1.prisma.buyerProfile.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                displayName: true,
                status: true,
                userId: true,
                createdAt: true,
                user: { select: { email: true, phone: true } },
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminBuyerService.js.map