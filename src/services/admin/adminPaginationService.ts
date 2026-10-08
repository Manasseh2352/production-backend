import { prisma } from "../../prisma/client";

export const adminPaginationService = {
  parseCommonArgs(query: any) {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 20;
    const q = typeof query?.q === "string" ? query.q : undefined;
    const status = typeof query?.status === "string" ? query.status : undefined;

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    return { page: safePage, limit: safeLimit, skip, q, status };
  },

  async withPagination<T>(args: {
    total: Promise<number>;
    rows: Promise<T[]>;
    page: number;
    limit: number;
  }) {
    const [total, rows] = await Promise.all([args.total, args.rows]);
    return {
      rows,
      page: args.page,
      limit: args.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / args.limit)),
    };
  },
};

