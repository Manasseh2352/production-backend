"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFarmerService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminFarmerService = {
    async listFarmers(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (q) {
            where.OR = [
                { displayName: { contains: q, mode: "insensitive" } },
                { farmName: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
            ];
        }
        const total = client_1.prisma.farmerProfile.count({ where });
        const rows = client_1.prisma.farmerProfile.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                displayName: true,
                farmName: true,
                location: true,
                status: true,
                userId: true,
                profileImageUrl: true,
                createdAt: true,
                user: {
                    select: { email: true, phone: true },
                },
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminFarmerService.js.map