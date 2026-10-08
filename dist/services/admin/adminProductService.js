"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminProductService = {
    async listProducts(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (query?.productName)
            where.productName = query.productName;
        if (query?.farmerId)
            where.farmerProfileId = query.farmerId;
        if (q) {
            where.OR = [
                { productName: { equals: q } },
                { description: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
            ];
        }
        const total = client_1.prisma.product.count({ where });
        const rows = client_1.prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                productName: true,
                status: true,
                farmerProfileId: true,
                quantityKg: true,
                pricePerKg: true,
                totalValue: true,
                unit: true,
                location: true,
                createdAt: true,
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminProductService.js.map