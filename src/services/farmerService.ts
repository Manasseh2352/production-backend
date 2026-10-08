import { farmerRepository } from "../repositories/farmerRepository";

export const farmerService = {
  async createProfile(params: {
    userId: string;
    displayName: string;
    farmName?: string | null;
    location?: string | null;
  }) {
    const existing = await farmerRepository.getProfileByUserId(params.userId);
    if (existing) {
      const err: any = new Error("Farmer profile already exists");
      err.status = 409;
      throw err;
    }

    return farmerRepository.createProfile({
      userId: params.userId,
      displayName: params.displayName,
      farmName: params.farmName ?? null,
      location: params.location ?? null,
    });
  },

  async updateProfile(params: {
    userId: string;
    displayName?: string;
    farmName?: string | null;
    location?: string | null;
  }) {
    await farmerRepository.requireProfileByUserId(params.userId);
    return farmerRepository.updateProfile({
      userId: params.userId,
      displayName: params.displayName,
      farmName: params.farmName,
      location: params.location,
    });
  },

  async getProfile(userId: string) {
    await farmerRepository.requireProfileByUserId(userId);
    return farmerRepository.getProfileByUserId(userId);
  },

  async updateProfileImage(params: {
    userId: string;
    profileImageUrl: string;
    profileImagePublicId?: string | null;
  }) {
    await farmerRepository.requireProfileByUserId(params.userId);
    return farmerRepository.updateProfileImage(params);
  },

  async getDashboard(userId: string) {
    return farmerRepository.getDashboardMetrics(userId);
  },

  async listProducts(userId: string) {
    return farmerRepository.listProductsByUserId(userId);
  },

  async updateProductImages(userId: string, productId: string, images: string[]) {
    return farmerRepository.updateProductImagesById(userId, productId, images);
  },

  async listOrders(params: { userId: string; limit?: number; offset?: number }) {
    return farmerRepository.listOrdersByUserId(params);
  },
};

