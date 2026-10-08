import { prisma } from "../../prisma/client";
import { adminPaginationService } from "./adminPaginationService";

export const adminPaymentService = {
  async listPayments(query: any) {
    const { page, limit, skip, q, status } = adminPaginationService.parseCommonArgs(query);

    const where: any = {};
    if (status) where.status = status;
    if (query?.orderId) where.orderId = query.orderId;
    if (query?.method) where.method = query.method;

    if (q) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { providerPaymentId: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = prisma.payment.count({ where });

    const rows = prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        orderId: true,
        status: true,
        method: true,
        currency: true,
        amount: true,
        provider: true,
        providerPaymentId: true,
        authorizedAt: true,
        paidAt: true,
        failedAt: true,
        refundedAt: true,
        createdAt: true,
      },
    });

    return adminPaginationService.withPagination({ total, rows, page, limit });
  },
};

