"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerService = void 0;
const buyerRepository_1 = require("../repositories/buyerRepository");
const productRepository_1 = require("../repositories/productRepository");
const paymentService_1 = require("./paymentService");
exports.buyerService = {
    async createProfile(params) {
        return buyerRepository_1.buyerRepository.createProfile(params);
    },
    async updateProfile(params) {
        return buyerRepository_1.buyerRepository.updateProfile({
            userId: params.userId,
            displayName: params.displayName,
        });
    },
    async updateProfileImage(params) {
        return buyerRepository_1.buyerRepository.updateProfileImage(params);
    },
    async getProfile(userId) {
        await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.getProfileByUserId(userId);
    },
    async dashboard(userId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.getDashboard({ buyerProfileId: profile.id });
    },
    async addWishlistItem(userId, productId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.addWishlistItem({ buyerProfileId: profile.id, productId });
    },
    async removeWishlistItem(userId, productId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        await buyerRepository_1.buyerRepository.removeWishlistItem({ buyerProfileId: profile.id, productId });
    },
    async listWishlist(userId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.listWishlist({ buyerProfileId: profile.id });
    },
    async addSavedProduct(userId, productId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.addSavedProduct({ buyerProfileId: profile.id, productId });
    },
    async removeSavedProduct(userId, productId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        await buyerRepository_1.buyerRepository.removeSavedProduct({ buyerProfileId: profile.id, productId });
    },
    async listSavedProducts(userId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.listSavedProducts({ buyerProfileId: profile.id });
    },
    async listOrders(userId, opts) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.listOrders({ buyerProfileId: profile.id, ...opts });
    },
    async getOrder(userId, orderId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.getOrder({ buyerProfileId: profile.id, orderId });
    },
    async deleteOrder(userId, orderId) {
        const profile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return buyerRepository_1.buyerRepository.deleteUnpaidOrder({ buyerProfileId: profile.id, orderId });
    },
    // Product catalog (buyer-facing). Browsing does not require a buyer profile,
    // only a valid session — so we don't resolve a profile here.
    async listProducts(opts) {
        return productRepository_1.productRepository.listActiveProducts(opts);
    },
    async getProduct(productId) {
        const product = await productRepository_1.productRepository.getActiveProductById(productId);
        if (!product) {
            const err = new Error("Product not found");
            err.status = 404;
            throw err;
        }
        return product;
    },
    // Payment for an order this buyer owns (simulated gateway).
    async payForOrder(params) {
        return paymentService_1.paymentService.payForOrder(params);
    },
};
//# sourceMappingURL=buyerService.js.map