import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminBuyerService = {
  async listBuyers(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
      ];
    }

    const total = prisma.buyerProfile.count({ where });

    const rows = prisma.buyerProfile.findMany({
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

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

