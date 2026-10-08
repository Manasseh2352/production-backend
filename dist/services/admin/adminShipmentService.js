"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminShipmentService = void 0;
const client_1 = require("../../prisma/client");
const adminPaginationService_1 = require("./adminPaginationService");
exports.adminShipmentService = {
    async listShipments(query) {
        const { page, limit, skip, q, status } = adminPaginationService_1.adminPaginationService.parseCommonArgs(query);
        const where = {};
        if (status)
            where.status = status;
        if (query?.orderId)
            where.orderId = query.orderId;
        if (q) {
            where.OR = [
                { id: { contains: q, mode: "insensitive" } },
                { trackingNumber: { contains: q, mode: "insensitive" } },
            ];
        }
        const total = client_1.prisma.shipmentGroup.count({ where });
        const rows = client_1.prisma.shipmentGroup.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                orderId: true,
                status: true,
                destinationName: true,
                destinationAddress: true,
                trackingNumber: true,
                carrier: true,
                shippedAt: true,
                deliveredAt: true,
                createdAt: true,
            },
        });
        return adminPaginationService_1.adminPaginationService.withPagination({ total, rows, page, limit });
    },
};
//# sourceMappingURL=adminShipmentService.js.map