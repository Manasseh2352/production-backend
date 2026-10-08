import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { uploadProfileImageSchema, createFarmerProfileSchema, updateFarmerProfileSchema } from "../validators/farmerValidator";

import { farmerService } from "../services/farmerService";
import { productService } from "../services/productService";
import { env } from "../config/env";

import { uploadBufferToImageKit } from "../lib/imagekit";
import type { ProductTypeName } from "../constants/productTypes";

export const farmerController = {

  async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = createFarmerProfileSchema.parse(req.body);

      const profile = await farmerService.createProfile({
        userId,
        displayName: body.displayName,
        farmName: body.farmName,
        location: body.location,
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

      const body = updateFarmerProfileSchema.parse(req.body);

      // Convert undefined->undefined; null allowed for farmName/location
      const profile = await farmerService.updateProfile({
        userId,
        displayName: body.displayName,
        farmName: body.farmName,
        location: body.location,
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

      const profile = await farmerService.getProfile(userId);
      return res.json({ ok: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      uploadProfileImageSchema.parse({});

      const file = (req as any).file as { buffer: Buffer; mimetype?: string } | undefined;
      if (!file?.buffer) {
        return res.status(400).json({ error: "Missing file" });
      }

      const { url, publicId } = await uploadBufferToImageKit(
        file.buffer,
        "farmers/profile-images"
      );

      const profile = await farmerService.updateProfileImage({
        userId,
        profileImageUrl: url,
        profileImagePublicId: publicId,
      });

      return res.json({ ok: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async uploadProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const file = (req as any).file as { buffer: Buffer; mimetype?: string } | undefined;
      if (!file?.buffer) {
        return res.status(400).json({ error: "Missing file" });
      }

      const { url, publicId } = await uploadBufferToImageKit(
        file.buffer,
        "farmers/products"
      );

      return res.json({ ok: true, url, publicId });
    } catch (err) {
      next(err);
    }
  },

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const metrics = await farmerService.getDashboard(userId);
      return res.json({ ok: true, dashboard: metrics });
    } catch (err) {
      next(err);
    }
  },

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = (req as any).validatedBody as {
        productName: ProductTypeName;
        state?: string;
        quantityKg: number;
        unitPriceOverride?: number;
        description?: string;
        location?: string;
        destinationCountry?: string;
        images?: string[];
        imageUrl?: string;
      };

      const normalizedImages = Array.isArray(body.images)
        ? body.images.filter(Boolean)
        : body.imageUrl
          ? [body.imageUrl]
          : undefined;

      const profile = await farmerService.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Farmer profile not found" });
      }

      const created = await productService.createFromFarmerUpload({
        farmerProfileId: profile.id,
        productName: body.productName,
        state: body.state,
        quantityKg: body.quantityKg,
        unitPriceOverride: body.unitPriceOverride,
        description: body.description,
        location: body.location,
        destinationCountry: body.destinationCountry,
        images: normalizedImages,
      });

      return res.status(201).json({ ok: true, product: created });
    } catch (err) {
      next(err);
    }
  },

  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const products = await farmerService.listProducts(userId);
      return res.json({ ok: true, products });
    } catch (err) {
      next(err);
    }
  },

  async updateProductImages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;

      const body = req.body as { images?: string[]; imageUrl?: string };
      const images = Array.isArray(body.images)
        ? body.images
        : body.imageUrl
          ? [body.imageUrl]
          : [];

      const normalized = [...new Set(images.filter(Boolean))].slice(0, 10);
      if (normalized.length === 0) {
        return res.status(400).json({ error: "At least one valid image URL is required" });
      }

      const product = await farmerService.updateProductImages(userId, productId, normalized);
      return res.json({ ok: true, product });
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

      const orders = await farmerService.listOrders({ userId, limit, offset });
      return res.json({ ok: true, orders });
    } catch (err) {
      next(err);
    }
  },
};
