import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { buyerService } from "../services/buyerService";
import { parseProductIdParam } from "../validators/buyerValidator";
import { uploadBufferToImageKit } from "../lib/imagekit";
import { isProductType } from "../constants/productTypes";

const createBuyerProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
});

const payOrderSchema = z.object({
  method: z
    .enum(["CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY", "WALLET"])
    .optional(),
});

export const buyerController = {
  async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = createBuyerProfileSchema.parse(req.body);
      const profile = await buyerService.createProfile({
        userId,
        displayName: body.displayName,
      });

      return res.status(201).json({ ok: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = req.body as { displayName: string };
      const profile = await buyerService.updateProfile({
        userId,
        displayName: body.displayName,
      });

      return res.json({ ok: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const profile = await buyerService.getProfile(userId);
      return res.json({ ok: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const file = (req as any).file as { buffer: Buffer; mimetype?: string } | undefined;
      if (!file?.buffer) {
        return res.status(400).json({ error: "Missing file" });
      }

      const { url, publicId } = await uploadBufferToImageKit(
        file.buffer,
        "buyers/profile-images"
      );

      const profile = await buyerService.updateProfileImage({
        userId,
        profileImageUrl: url,
        profileImagePublicId: publicId,
      });

      return res.json({ ok: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const metrics = await buyerService.dashboard(userId);
      return res.json({ ok: true, dashboard: metrics });
    } catch (err) {
      next(err);
    }
  },

  async addSavedProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { productId } = req.body as { productId: string };
      const item = await buyerService.addSavedProduct(userId, productId);
      return res.status(201).json({ ok: true, item });
    } catch (err) {
      next(err);
    }
  },

  async removeSavedProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { productId } = parseProductIdParam(req);
      await buyerService.removeSavedProduct(userId, productId);
      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async listSavedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const items = await buyerService.listSavedProducts(userId);
      return res.json({ ok: true, items });
    } catch (err) {
      next(err);
    }
  },

  async addWishlistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { productId } = req.body as { productId: string };
      const item = await buyerService.addWishlistItem(userId, productId);
      return res.status(201).json({ ok: true, item });
    } catch (err) {
      next(err);
    }
  },

  async removeWishlistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { productId } = parseProductIdParam(req);
      await buyerService.removeWishlistItem(userId, productId);
      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async listWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const items = await buyerService.listWishlist(userId);
      return res.json({ ok: true, items });
    } catch (err) {
      next(err);
    }
  },

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const orders = await buyerService.listOrders(userId, { limit, offset });
      return res.json({ ok: true, orders });
    } catch (err) {
      next(err);
    }
  },

  async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const orderId = Array.isArray(req.params.orderId)
        ? req.params.orderId[0]
        : req.params.orderId;
      const order = await buyerService.getOrder(userId, orderId);

      return res.json({ ok: true, order });
    } catch (err) {
      next(err);
    }
  },

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const orderId = Array.isArray(req.params.orderId)
        ? req.params.orderId[0]
        : req.params.orderId;
      const result = await buyerService.deleteOrder(userId, orderId);

      return res.json({ ok: true, deletedOrderId: result.deletedOrderId });
    } catch (err) {
      next(err);
    }
  },

  // Product catalog
  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const rawType = Array.isArray(req.query.productName)
        ? req.query.productName[0]
        : req.query.productName;
      const productName = isProductType(rawType) ? rawType : undefined;

      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const products = await buyerService.listProducts({
        q,
        productName,
        limit,
        offset,
      });
      return res.json({ ok: true, products });
    } catch (err) {
      next(err);
    }
  },

  async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;
      const product = await buyerService.getProduct(productId);

      return res.json({ ok: true, product });
    } catch (err) {
      next(err);
    }
  },

  // Payment
  async payOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const orderId = Array.isArray(req.params.orderId)
        ? req.params.orderId[0]
        : req.params.orderId;
      const body = payOrderSchema.parse(req.body ?? {});

      const result = await buyerService.payForOrder({
        userId,
        orderId,
        method: body.method,
      });

      return res.json({
        ok: true,
        alreadyPaid: result.alreadyPaid,
        payment: result.payment,
      });
    } catch (err) {
      next(err);
    }
  },
};
