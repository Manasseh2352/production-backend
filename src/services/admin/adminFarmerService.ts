import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminFarmerService = {
  async listFarmers(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: "insensitive" } },
        { farmName: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = prisma.farmerProfile.count({ where });

    const rows = prisma.farmerProfile.findMany({
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

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

