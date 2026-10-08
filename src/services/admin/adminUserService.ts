import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminUserService = {
  async listUsers(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = prisma.user.count({ where });
    const rows = prisma.user.findMany({
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

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

