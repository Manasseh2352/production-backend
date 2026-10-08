import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminProductService = {
  async listProducts(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;
    if (query?.productName) where.productName = query.productName;
    if (query?.farmerId) where.farmerProfileId = query.farmerId;

    if (q) {
      where.OR = [
        { productName: { equals: q } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = prisma.product.count({ where });

    const rows = prisma.product.findMany({
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

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

