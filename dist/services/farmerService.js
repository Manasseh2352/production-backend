"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerService = void 0;
const farmerRepository_1 = require("../repositories/farmerRepository");
exports.farmerService = {
    async createProfile(params) {
        const existing = await farmerRepository_1.farmerRepository.getProfileByUserId(params.userId);
        if (existing) {
            const err = new Error("Farmer profile already exists");
            err.status = 409;
            throw err;
        }
        return farmerRepository_1.farmerRepository.createProfile({
            userId: params.userId,
            displayName: params.displayName,
            farmName: params.farmName ?? null,
            location: params.location ?? null,
        });
    },
    async updateProfile(params) {
        await farmerRepository_1.farmerRepository.requireProfileByUserId(params.userId);
        return farmerRepository_1.farmerRepository.updateProfile({
            userId: params.userId,
            displayName: params.displayName,
            farmName: params.farmName,
            location: params.location,
        });
    },
    async getProfile(userId) {
        await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        return farmerRepository_1.farmerRepository.getProfileByUserId(userId);
    },
    async updateProfileImage(params) {
        await farmerRepository_1.farmerRepository.requireProfileByUserId(params.userId);
        return farmerRepository_1.farmerRepository.updateProfileImage(params);
    },
    async getDashboard(userId) {
        return farmerRepository_1.farmerRepository.getDashboardMetrics(userId);
    },
    async listProducts(userId) {
        return farmerRepository_1.farmerRepository.listProductsByUserId(userId);
    },
    async updateProductImages(userId, productId, images) {
        return farmerRepository_1.farmerRepository.updateProductImagesById(userId, productId, images);
    },
    async listOrders(params) {
        return farmerRepository_1.farmerRepository.listOrdersByUserId(params);
    },
};
//# sourceMappingURL=farmerService.js.map