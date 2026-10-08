import { prisma } from "../prisma/client";

export const buyerRepository = {
  async createProfile(params: { userId: string; displayName: string }) {
    const existing = await prisma.buyerProfile.findUnique({ where: { userId: params.userId } });
    if (existing) {
      const err: any = new Error("Buyer profile already exists");
      err.status = 409;
      throw err;
    }

    return prisma.buyerProfile.create({
      data: {
        userId: params.userId,
        displayName: params.displayName,
      },
    });
  },

  async requireProfileByUserId(userId: string) {
    const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) {
      const err: any = new Error("Buyer profile not found");
      err.status = 404;
      throw err;
    }
    return profile;
  },

  async updateProfile(params: {
    userId: string;
    displayName?: string;
  }) {
    await this.requireProfileByUserId(params.userId);

    return prisma.buyerProfile.update({
      where: { userId: params.userId },
      data: {
        ...(params.displayName !== undefined ? { displayName: params.displayName } : {}),
      },
    });
  },

  async updateProfileImage(params: {
    userId: string;
    profileImageUrl: string;
    profileImagePublicId: string;
  }) {
    await this.requireProfileByUserId(params.userId);

    return prisma.buyerProfile.update({
      where: { userId: params.userId },
      data: {
        profileImageUrl: params.profileImageUrl,
        profileImagePublicId: params.profileImagePublicId,
      },
    });
  },

  async getProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({ where: { userId } });
  },

  async getProfileWithUser(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  },

  // Wishlist
  async addWishlistItem(params: { buyerProfileId: string; productId: string }) {
    // Ensure product exists
    await prisma.product.findUnique({ where: { id: params.productId } });

    return prisma.wishlistItem.create({
      data: {
        buyerProfileId: params.buyerProfileId,
        productId: params.productId,
      },
    });
  },

  async removeWishlistItem(params: { buyerProfileId: string; productId: string }) {
    await prisma.wishlistItem.deleteMany({
      where: { buyerProfileId: params.buyerProfileId, productId: params.productId },
    });
  },

  async listWishlist(params: { buyerProfileId: string }) {
    return prisma.wishlistItem.findMany({
      where: { buyerProfileId: params.buyerProfileId },
      include: {
        product: {
          include: {
            farmerProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Saved Products
  async addSavedProduct(params: { buyerProfileId: string; productId: string }) {
    await prisma.product.findUnique({ where: { id: params.productId } });

    return prisma.savedProduct.create({
      data: {
        buyerProfileId: params.buyerProfileId,
        productId: params.productId,
      },
    });
  },

  async removeSavedProduct(params: { buyerProfileId: string; productId: string }) {
    await prisma.savedProduct.deleteMany({
      where: { buyerProfileId: params.buyerProfileId, productId: params.productId },
    });
  },

  async listSavedProducts(params: { buyerProfileId: string }) {
    return prisma.savedProduct.findMany({
      where: { buyerProfileId: params.buyerProfileId },
      include: {
        product: {
          include: {
            farmerProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Orders
  async listOrders(params: { buyerProfileId: string; limit?: number; offset?: number }) {
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const offset = params.offset && params.offset >= 0 ? params.offset : 0;

    return prisma.order.findMany({
      where: { buyerProfileId: params.buyerProfileId },
      include: {
        payments: true,
        shipmentGroups: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  async getOrder(params: { buyerProfileId: string; orderId: string }) {
    const order = await prisma.order.findFirst({
      where: { buyerProfileId: params.buyerProfileId, id: params.orderId },
      include: {
        payments: true,
        shipmentGroups: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      const err: any = new Error("Order not found");
      err.status = 404;
      throw err;
    }

    return order;
  },

  async deleteUnpaidOrder(params: { buyerProfileId: string; orderId: string }) {
    const order = await prisma.order.findFirst({
      where: { buyerProfileId: params.buyerProfileId, id: params.orderId },
      include: { payments: true },
    });

    if (!order) {
      const err: any = new Error("Order not found");
      err.status = 404;
      throw err;
    }

    const hasPaidPayment = order.payments.some((payment: any) => payment.status === "PAID");
    if (hasPaidPayment) {
      const err: any = new Error("You cannot delete an order that has already been paid for");
      err.status = 409;
      throw err;
    }

    await prisma.order.delete({ where: { id: params.orderId } });
    return { deletedOrderId: params.orderId };
  },

  async getDashboard(params: { buyerProfileId: string }) {
    const profile = await prisma.buyerProfile.findUnique({ where: { id: params.buyerProfileId } });
    if (!profile) {
      const err: any = new Error("Buyer profile not found");
      err.status = 404;
      throw err;
    }

    const totalOrdersAgg = await prisma.order.aggregate({
      _count: { id: true },
      where: { buyerProfileId: params.buyerProfileId },
    });

    const activeOrdersAgg = await prisma.order.count({
      where: {
        buyerProfileId: params.buyerProfileId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      } as any,
    });

    const wishlistCountAgg = await prisma.wishlistItem.count({
      where: { buyerProfileId: params.buyerProfileId },
    });

    const savedProductsCountAgg = await prisma.savedProduct.count({
      where: { buyerProfileId: params.buyerProfileId },
    });

    // Total spent: sum payments that are PAID
    const totalSpentAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        order: { buyerProfileId: params.buyerProfileId },
        status: "PAID",
      },
    });

    return {
      totalOrders: totalOrdersAgg._count.id,
      activeOrders: activeOrdersAgg,
      totalSpent: totalSpentAgg._sum.amount ?? 0,
      wishlistCount: wishlistCountAgg,
      savedProductsCount: savedProductsCountAgg,
    };
  },
};

