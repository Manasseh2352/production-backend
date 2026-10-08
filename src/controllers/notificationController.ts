import type { NextFunction, Request, Response } from "express";

import { notificationService } from "../services/notificationService";
import {
  cartNotifySchema,
  listNotificationsQuerySchema,
} from "../validators/notificationValidator";

// Shared by buyer and farmer routers — notifications are keyed on req.user.id,
// so the same handlers serve both roles.
export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const q = listNotificationsQuerySchema.parse(req.query);

      const [notifications, unreadCount] = await Promise.all([
        notificationService.list({
          userId,
          limit: q.limit,
          offset: q.offset,
          unreadOnly: q.unread,
        }),
        notificationService.unreadCount(userId),
      ]);

      return res.json({ ok: true, unreadCount, notifications });
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const unreadCount = await notificationService.unreadCount(userId);
      return res.json({ ok: true, unreadCount });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await notificationService.markRead(userId, id);
      if (!updated) {
        return res.status(404).json({ error: "Notification not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const updated = await notificationService.markAllRead(userId);
      return res.json({ ok: true, updated });
    } catch (err) {
      next(err);
    }
  },

  // Buyer-only: record an "added to cart" notification.
  async notifyCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = cartNotifySchema.parse(req.body);
      const notification = await notificationService.create({
        userId,
        type: "CART_ITEM_ADDED",
        ctx: {
          productId: body.productId,
          productName: body.productName,
          quantityKg: body.quantityKg,
        },
      });

      return res.status(201).json({ ok: true, notification });
    } catch (err) {
      next(err);
    }
  },
};
