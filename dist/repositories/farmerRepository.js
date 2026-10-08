"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerRepository = void 0;
const client_1 = require("../prisma/client");
exports.farmerRepository = {
    async createProfile(params) {
        return client_1.prisma.farmerProfile.create({
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
    async updateProfile(params) {
        return client_1.prisma.farmerProfile.update({
            where: { userId: params.userId },
            data: {
                ...(params.displayName !== undefined ? { displayName: params.displayName } : {}),
                ...(params.farmName !== undefined ? { farmName: params.farmName } : {}),
                ...(params.location !== undefined ? { location: params.location } : {}),
            },
        });
    },
    async getProfileByUserId(userId) {
        return client_1.prisma.farmerProfile.findUnique({
            where: { userId },
        });
    },
    async updateProfileImage(params) {
        return client_1.prisma.farmerProfile.update({
            where: { userId: params.userId },
            data: {
                profileImageUrl: params.profileImageUrl,
                profileImagePublicId: params.profileImagePublicId ?? null,
            },
        });
    },
    async requireProfileByUserId(userId) {
        const profile = await this.getProfileByUserId(userId);
        if (!profile) {
            const err = new Error("Farmer profile not found");
            err.status = 404;
            throw err;
        }
        return profile;
    },
    async getDashboardMetrics(userId) {
        // total orders/revenue/active shipments based on shipment groups/items belonging to the farmer's products.
        // Join path: FarmerProfile -> Product -> ShipmentItem -> ShipmentGroup -> Order
        const profile = await this.requireProfileByUserId(userId);
        const totalProducts = await client_1.prisma.product.count({
            where: { farmerProfileId: profile.id },
        });
        const totalOrdersAgg = await client_1.prisma.order.aggregate({
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
        const totalRevenueAgg = await client_1.prisma.shipmentItem.aggregate({
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
        const activeShipmentsAgg = await client_1.prisma.shipmentGroup.count({
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
    async listProductsByUserId(userId) {
        const profile = await this.requireProfileByUserId(userId);
        return client_1.prisma.product.findMany({
            where: { farmerProfileId: profile.id },
            orderBy: { createdAt: "desc" },
        });
    },
    async updateProductImagesById(userId, productId, images) {
        const profile = await this.requireProfileByUserId(userId);
        const product = await client_1.prisma.product.findFirst({
            where: { id: productId, farmerProfileId: profile.id },
        });
        if (!product) {
            const err = new Error("Product not found for this farmer");
            err.status = 404;
            throw err;
        }
        return client_1.prisma.product.update({
            where: { id: productId },
            data: {
                images: [...new Set(images.filter(Boolean))].slice(0, 10),
            },
        });
    },
    // Orders that contain at least one of this farmer's products.
    async listOrdersByUserId(params) {
        const profile = await this.requireProfileByUserId(params.userId);
        const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
        const offset = params.offset && params.offset >= 0 ? params.offset : 0;
        return client_1.prisma.order.findMany({
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
//# sourceMappingURL=farmerRepository.js.map