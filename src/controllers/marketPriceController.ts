import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { marketPriceService } from "../services/marketPriceService";

const addMarketPriceSchema = z.object({
  productId: z.string().min(1),
  recordedAt: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  price: z.number().positive(),
  currency: z.string().min(1).optional(),
  source: z
    .enum(["USER_REPORTED", "FEED", "MANUAL_ENTRY", "EXTERNAL_PROVIDER"])
    .optional(),
  state: z.string().min(1).optional(), // maps to MarketPrice.region
  quality: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

const updateMarketPriceSchema = z.object({
  productId: z.string().min(1).optional(),
  recordedAt: z.string().datetime().optional(),
  price: z.number().positive().optional(),
  currency: z.string().min(1).optional(),
  source: z
    .enum(["USER_REPORTED", "FEED", "MANUAL_ENTRY", "EXTERNAL_PROVIDER"])
    .optional(),
  state: z.string().min(1).optional(),
  quality: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

export const marketPriceController = {
  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const body = addMarketPriceSchema.parse(req.body);

      const created = await marketPriceService.addMarketPrice({
        productId: body.productId,
        recordedAt: new Date(body.recordedAt),
        price: body.price,
        currency: body.currency,
        source: body.source,
        region: body.state ?? null,
        quality: body.quality ?? null,
        notes: body.notes ?? null,
      });

      return res.status(201).json({ ok: true, marketPrice: created });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const body = updateMarketPriceSchema.parse(req.body);

      const updated = await marketPriceService.updateMarketPrice(id, {
        productId: body.productId,
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
        price: body.price,
        currency: body.currency,
        source: body.source,
        region: body.state ?? undefined,
        quality: body.quality ?? undefined,
        notes: body.notes ?? undefined,
      });

      return res.json({ ok: true, marketPrice: updated });
    } catch (err) {
      next(err);
    }
  },

  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const querySchema = z.object({
        productId: z.string().min(1),
        state: z.string().min(1).optional(),
      });

      const q = querySchema.parse(req.query);

      const current = await marketPriceService.getCurrentPrice({
        productId: Array.isArray(q.productId) ? q.productId[0] : q.productId,
        region: q.state ? (Array.isArray(q.state) ? q.state[0] : q.state) : undefined,
      });

      return res.json({ ok: true, currentPrice: current ?? null });
    } catch (err) {
      next(err);
    }
  },
};

