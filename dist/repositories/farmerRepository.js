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
        // total products
        const totalProducts = await client_1.prisma.product.count({
            where: { farmerProfileId: (await this.requireProfileByUserId(userId)).id },
        });
        // total orders/revenue/active shipments based on shipment groups/items belonging to the farmer's products.
        // Join path: FarmerProfile -> Product -> ShipmentItem -> ShipmentGroup -> Order
        const profile = await this.requireProfileByUserId(userId);
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
};
//# sourceMappingURL=farmerRepository.js.map