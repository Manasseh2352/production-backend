import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { pricePredictionService } from "../services/ai/pricePredictionService";
import { demandForecastingService } from "../services/ai/demandForecastingService";
import { profitEstimationService } from "../services/ai/profitEstimationService";
import { cropRecommendationService } from "../services/ai/cropRecommendationService";
import { shippingRecommendationService } from "../services/ai/shippingRecommendationService";

const featuresSchema = z.record(z.string(), z.unknown()).optional();

const pricePredictionSchema = z.object({
  productId: z.string().min(1).optional(),
  state: z.string().optional(),
  region: z.string().optional(),
  currency: z.string().optional(),
  features: featuresSchema,
});

const demandForecastingSchema = z.object({
  productId: z.string().min(1).optional(),
  state: z.string().optional(),
  region: z.string().optional(),
  horizonDays: z.number().int().positive().max(90).optional(),
  features: featuresSchema,
});

const profitEstimationSchema = z.object({
  productId: z.string().min(1).optional(),
  state: z.string().optional(),
  region: z.string().optional(),
  expectedSellPrice: z.number().nonnegative().optional(),
  expectedCost: z.number().nonnegative().optional(),
  expectedRevenue: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  features: featuresSchema,
});

const cropRecommendationSchema = z.object({
  farmerProfileId: z.string().min(1).optional(),
  state: z.string().optional(),
  season: z.string().optional(),
  soilType: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  riskProfile: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  features: featuresSchema,
});

const shippingRecommendationSchema = z.object({
  orderId: z.string().min(1).optional(),
  destinationCountry: z.string().optional(),
  weightKg: z.number().nonnegative().optional(),
  shipmentType: z.string().optional(),
  features: featuresSchema,
});

export const aiController = {
  async pricePrediction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const input = pricePredictionSchema.parse(req.body ?? {});
      const result = await pricePredictionService.predict(input);
      return res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  },

  async demandForecasting(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const input = demandForecastingSchema.parse(req.body ?? {});
      const result = await demandForecastingService.forecast(input);
      return res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  },

  async profitEstimation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const input = profitEstimationSchema.parse(req.body ?? {});
      const result = await profitEstimationService.estimate(input);
      return res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  },

  async cropRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const input = cropRecommendationSchema.parse(req.body ?? {});
      const result = await cropRecommendationService.recommend(input);
      return res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  },

  async shippingRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const input = shippingRecommendationSchema.parse(req.body ?? {});
      const result = await shippingRecommendationService.recommend(input);
      return res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  },
};
