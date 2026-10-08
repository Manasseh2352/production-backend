import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminShipmentService = {
  async listShipments(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;
    if (query?.orderId) where.orderId = query.orderId;

    if (q) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { trackingNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = prisma.shipmentGroup.count({ where });

    const rows = prisma.shipmentGroup.findMany({
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

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

