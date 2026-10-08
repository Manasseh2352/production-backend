import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminOrderService = {
  async listOrders(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;

    if (query?.buyerId) {
      where.buyerProfileId = query.buyerId;
    }

    if (q) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = prisma.order.count({ where });

    const rows = prisma.order.findMany({
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

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

