import { buyerRepository } from "../repositories/buyerRepository";
import { productRepository } from "../repositories/productRepository";
import { paymentService } from "./paymentService";
import type { ProductTypeName } from "../constants/productTypes";

export const buyerService = {
  async createProfile(params: { userId: string; displayName: string }) {
    return buyerRepository.createProfile(params);
  },

  async updateProfile(params: { userId: string; displayName: string }) {
    return buyerRepository.updateProfile({
      userId: params.userId,
      displayName: params.displayName,
    });
  },

  async updateProfileImage(params: {
    userId: string;
    profileImageUrl: string;
    profileImagePublicId: string;
  }) {
    return buyerRepository.updateProfileImage(params);
  },

  async getProfile(userId: string) {
    await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.getProfileByUserId(userId);
  },

  async dashboard(userId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.getDashboard({ buyerProfileId: profile.id });
  },

  async addWishlistItem(userId: string, productId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.addWishlistItem({ buyerProfileId: profile.id, productId });
  },

  async removeWishlistItem(userId: string, productId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    await buyerRepository.removeWishlistItem({ buyerProfileId: profile.id, productId });
  },

  async listWishlist(userId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.listWishlist({ buyerProfileId: profile.id });
  },

  async addSavedProduct(userId: string, productId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.addSavedProduct({ buyerProfileId: profile.id, productId });
  },

  async removeSavedProduct(userId: string, productId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    await buyerRepository.removeSavedProduct({ buyerProfileId: profile.id, productId });
  },

  async listSavedProducts(userId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.listSavedProducts({ buyerProfileId: profile.id });
  },

  async listOrders(userId: string, opts: { limit?: number; offset?: number }) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.listOrders({ buyerProfileId: profile.id, ...opts });
  },

  async getOrder(userId: string, orderId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.getOrder({ buyerProfileId: profile.id, orderId });
  },

  async deleteOrder(userId: string, orderId: string) {
    const profile = await buyerRepository.requireProfileByUserId(userId);
    return buyerRepository.deleteUnpaidOrder({ buyerProfileId: profile.id, orderId });
  },

  // Product catalog (buyer-facing). Browsing does not require a buyer profile,
  // only a valid session — so we don't resolve a profile here.
  async listProducts(opts: {
    q?: string;
    productName?: ProductTypeName;
    limit?: number;
    offset?: number;
  }) {
    return productRepository.listActiveProducts(opts);
  },

  async getProduct(productId: string) {
    const product = await productRepository.getActiveProductById(productId);
    if (!product) {
      const err: any = new Error("Product not found");
      err.status = 404;
      throw err;
    }
    return product;
  },

  // Payment for an order this buyer owns (simulated gateway).
  async payForOrder(params: {
    userId: string;
    orderId: string;
    method?: "CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | "WALLET";
  }) {
    return paymentService.payForOrder(params);
  },
};

