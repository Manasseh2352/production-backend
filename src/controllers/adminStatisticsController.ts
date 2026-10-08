import type { Request, Response, NextFunction } from "express";

import { adminStatisticsService } from "../services/admin/adminStatisticsService";

export const adminStatisticsController = {
  async revenue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminStatisticsService.revenue();
      return res.json({ ok: true, revenue: data });
    } catch (err) {
      next(err);
    }
  },

  async orders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminStatisticsService.orders();
      return res.json({ ok: true, orders: data });
    } catch (err) {
      next(err);
    }
  },

  async shipments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminStatisticsService.shipments();
      return res.json({ ok: true, shipments: data });
    } catch (err) {
      next(err);
    }
  },

  async farmers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminStatisticsService.farmers();
      return res.json({ ok: true, farmers: data });
    } catch (err) {
      next(err);
    }
  },

  async topProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminStatisticsService.topProducts();
      return res.json({ ok: true, topProducts: data });
    } catch (err) {
      next(err);
    }
  },
};

