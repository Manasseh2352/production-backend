"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerRepository = void 0;
const client_1 = require("../prisma/client");
exports.buyerRepository = {
    async createProfile(params) {
        const existing = await client_1.prisma.buyerProfile.findUnique({ where: { userId: params.userId } });
        if (existing) {
            const err = new Error("Buyer profile already exists");
            err.status = 409;
            throw err;
        }
        return client_1.prisma.buyerProfile.create({
            data: {
                userId: params.userId,
                displayName: params.displayName,
            },
        });
    },
    async requireProfileByUserId(userId) {
        const profile = await client_1.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!profile) {
            const err = new Error("Buyer profile not found");
            err.status = 404;
            throw err;
        }
        return profile;
    },
    async updateProfile(params) {
        await this.requireProfileByUserId(params.userId);
        return client_1.prisma.buyerProfile.update({
            where: { userId: params.userId },
            data: {
                ...(params.displayName !== undefined ? { displayName: params.displayName } : {}),
            },
        });
    },
    async getProfileByUserId(userId) {
        return client_1.prisma.buyerProfile.findUnique({ where: { userId } });
    },
    async getProfileWithUser(userId) {
        return client_1.prisma.buyerProfile.findUnique({
            where: { userId },
            include: { user: true },
        });
    },
    // Wishlist
    async addWishlistItem(params) {
        // Ensure product exists
        await client_1.prisma.product.findUnique({ where: { id: params.productId } });
        return client_1.prisma.wishlistItem.create({
            data: {
                buyerProfileId: params.buyerProfileId,
                productId: params.productId,
            },
        });
    },
    async removeWishlistItem(params) {
        await client_1.prisma.wishlistItem.deleteMany({
            where: { buyerProfileId: params.buyerProfileId, productId: params.productId },
        });
    },
    async listWishlist(params) {
        return client_1.prisma.wishlistItem.findMany({
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
    async addSavedProduct(params) {
        await client_1.prisma.product.findUnique({ where: { id: params.productId } });
        return client_1.prisma.savedProduct.create({
            data: {
                buyerProfileId: params.buyerProfileId,
                productId: params.productId,
            },
        });
    },
    async removeSavedProduct(params) {
        await client_1.prisma.savedProduct.deleteMany({
            where: { buyerProfileId: params.buyerProfileId, productId: params.productId },
        });
    },
    async listSavedProducts(params) {
        return client_1.prisma.savedProduct.findMany({
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
    async listOrders(params) {
        const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
        const offset = params.offset && params.offset >= 0 ? params.offset : 0;
        return client_1.prisma.order.findMany({
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
    async getOrder(params) {
        const order = await client_1.prisma.order.findFirst({
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
            const err = new Error("Order not found");
            err.status = 404;
            throw err;
        }
        return order;
    },
    async getDashboard(params) {
        const profile = await client_1.prisma.buyerProfile.findUnique({ where: { id: params.buyerProfileId } });
        if (!profile) {
            const err = new Error("Buyer profile not found");
            err.status = 404;
            throw err;
        }
        const totalOrdersAgg = await client_1.prisma.order.aggregate({
            _count: { id: true },
            where: { buyerProfileId: params.buyerProfileId },
        });
        const activeOrdersAgg = await client_1.prisma.order.count({
            where: {
                buyerProfileId: params.buyerProfileId,
                status: { notIn: ["DELIVERED", "CANCELLED"] },
            },
        });
        const wishlistCountAgg = await client_1.prisma.wishlistItem.count({
            where: { buyerProfileId: params.buyerProfileId },
        });
        const savedProductsCountAgg = await client_1.prisma.savedProduct.count({
            where: { buyerProfileId: params.buyerProfileId },
        });
        // Total spent: sum payments that are PAID
        const totalSpentAgg = await client_1.prisma.payment.aggregate({
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
//# sourceMappingURL=buyerRepository.js.map