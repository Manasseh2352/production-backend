import { prisma } from "../prisma/client";

export const farmerRepository = {
  async createProfile(params: {
    userId: string;
    displayName: string;
    farmName?: string | null;
    location?: string | null;
    profileImageUrl?: string | null;
    profileImagePublicId?: string | null;
  }) {
    return prisma.farmerProfile.create({
      data: {
        userId: params.userId,
        displayName: params.displayName,
        farmName: params.farmName ?? null,
        location: params.location ?? null,
        profileImageUrl: params.profileImageUrl ?? null,
        profileImagePublicId: params.profileImagePublicId ?? null,
      },
    });
  },

  async updateProfile(params: {
    userId: string;
    displayName?: string;
    farmName?: string | null;
    location?: string | null;
  }) {
    return prisma.farmerProfile.update({
      where: { userId: params.userId },
      data: {
        ...(params.displayName !== undefined ? { displayName: params.displayName } : {}),
        ...(params.farmName !== undefined ? { farmName: params.farmName } : {}),
        ...(params.location !== undefined ? { location: params.location } : {}),
      },
    });
  },

  async getProfileByUserId(userId: string) {
    return prisma.farmerProfile.findUnique({
      where: { userId },
    });
  },

  async updateProfileImage(params: {
    userId: string;
    profileImageUrl: string;
    profileImagePublicId?: string | null;
  }) {
    return prisma.farmerProfile.update({
      where: { userId: params.userId },
      data: {
        profileImageUrl: params.profileImageUrl,
        profileImagePublicId: params.profileImagePublicId ?? null,
      },
    });
  },

  async requireProfileByUserId(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      const err: any = new Error("Farmer profile not found");
      err.status = 404;
      throw err;
    }
    return profile;
  },

  async getDashboardMetrics(userId: string) {

    // total orders/revenue/active shipments based on shipment groups/items belonging to the farmer's products.
    // Join path: FarmerProfile -> Product -> ShipmentItem -> ShipmentGroup -> Order
    const profile = await this.requireProfileByUserId(userId);

    const totalProducts = await prisma.product.count({
      where: { farmerProfileId: profile.id },
    });

    const totalOrdersAgg = await prisma.order.aggregate({
      _count: { id: true },
      where: {
        shipmentGroups: {
          some: {
            items: {
              some: {
                product: { farmerProfileId: profile.id },
              },
            },
          },
        },
      },
    });

    const totalRevenueAgg = await prisma.shipmentItem.aggregate({
      _sum: { lineTotal: true },
      where: {
        product: { farmerProfileId: profile.id },
        // include all (per confirmation), but we still exclude cancelled group? We'll keep broad.
        shipmentGroup: {
          status: { not: "CANCELLED" },
        },
      },
    });

    // active shipments: ShipmentGroup statuses except DELIVERED/CANCELLED
    const activeShipmentsAgg = await prisma.shipmentGroup.count({
      where: {
        status: { notIn: ["DELIVERED", "CANCELLED"] },
        items: {
          some: {
            product: { farmerProfileId: profile.id },
          },
        },
      },
    });

    return {
      totalProducts,
      totalOrders: totalOrdersAgg._count.id,
      totalRevenue: totalRevenueAgg._sum.lineTotal ?? 0,
      activeShipments: activeShipmentsAgg,
    };

  },

  async listProductsByUserId(userId: string) {
    const profile = await this.requireProfileByUserId(userId);
    return prisma.product.findMany({
      where: { farmerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateProductImagesById(userId: string, productId: string, images: string[]) {
    const profile = await this.requireProfileByUserId(userId);
    const product = await prisma.product.findFirst({
      where: { id: productId, farmerProfileId: profile.id },
    });

    if (!product) {
      const err: any = new Error("Product not found for this farmer");
      err.status = 404;
      throw err;
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        images: [...new Set(images.filter(Boolean))].slice(0, 10),
      },
    });
  },

  // Orders that contain at least one of this farmer's products.
  async listOrdersByUserId(params: { userId: string; limit?: number; offset?: number }) {
    const profile = await this.requireProfileByUserId(params.userId);
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const offset = params.offset && params.offset >= 0 ? params.offset : 0;

    return prisma.order.findMany({
      where: {
        shipmentGroups: {
          some: {
            items: { some: { product: { farmerProfileId: profile.id } } },
          },
        },
      },
      include: {
        payments: true,
        shipmentGroups: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },
};

