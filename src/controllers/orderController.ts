import type { NextFunction, Request, Response } from "express";

import { z } from "zod";

import { orderService } from "../services/orderService";
import { acceptRejectOrderParamsSchema, placeOrderSchema } from "../validators/orderValidator";

export const orderController = {
  async placeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = placeOrderSchema.parse(req.body);

      const created = await orderService.placeOrder(userId, body);
      return res.status(201).json({ ok: true, ...created });
    } catch (err) {
      next(err);
    }
  },

  async acceptOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const params = acceptRejectOrderParamsSchema.parse({
        orderId: Array.isArray(req.params.orderId)
          ? req.params.orderId[0]
          : req.params.orderId,
      });

      const result = await orderService.acceptOrder(userId, params.orderId);
      return res.json({ ...result });

    } catch (err) {
      next(err);
    }
  },

  async rejectOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const params = acceptRejectOrderParamsSchema.parse({
        orderId: Array.isArray(req.params.orderId)
          ? req.params.orderId[0]
          : req.params.orderId,
      });

      const result = await orderService.rejectOrder(userId, params.orderId);
      return res.json({ ...result });

    } catch (err) {
      next(err);
    }
  },

  async advanceShipmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const params = acceptRejectOrderParamsSchema.parse({
        orderId: Array.isArray(req.params.orderId)
          ? req.params.orderId[0]
          : req.params.orderId,
      });

      const rawStatus = (req.body as { status?: string })?.status;
      const validStatuses = ["PACKED", "SHIPPED", "DELIVERED"] as const;

      if (!rawStatus || !(validStatuses as readonly string[]).includes(rawStatus)) {
        return res.status(400).json({ error: "Invalid shipment status" });
      }

      const result = await orderService.advanceShipmentStatus(userId, params.orderId, rawStatus as any);
      return res.json({ ...result, ok: true });
    } catch (err) {
      next(err);
    }
  },

  // Buyer confirms goods received → releases farmer escrow.
  async confirmReceived(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const params = acceptRejectOrderParamsSchema.parse({
        orderId: Array.isArray(req.params.orderId)
          ? req.params.orderId[0]
          : req.params.orderId,
      });

      const result = await orderService.confirmReceived(userId, params.orderId);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

