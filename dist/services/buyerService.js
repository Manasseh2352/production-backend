"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerService = void 0;
const buyerRepository_1 = require("../repositories/buyerRepository");
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
};
//# sourceMappingURL=buyerService.js.map