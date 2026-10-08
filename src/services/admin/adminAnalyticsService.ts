import { prisma } from "../../prisma/client";

export const adminAnalyticsService = {
  async getAnalytics() {
    // Lightweight “dashboard analytics” snapshot.
    const [activeFarmers, activeBuyers, activeProducts, recentOrdersCount] = await Promise.all([
      prisma.farmerProfile.count({ where: { status: "ACTIVE" } }),
      prisma.buyerProfile.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      activeFarmers,
      activeBuyers,
      activeProducts,
      recentOrdersCount,
    };
  },

  async getStatistics() {
    const [orders, shipments, payments] = await Promise.all([
      prisma.order.count(),
      prisma.shipmentGroup.count(),
      prisma.payment.count(),
    ]);

    return { orders, shipments, payments };
  },
};

