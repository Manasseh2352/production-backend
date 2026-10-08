"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminUserService = {
    async listUsers(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (q) {
            where.OR = [
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
            ];
        }
        const total = client_1.prisma.user.count({ where });
        const rows = client_1.prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminUserService.js.map