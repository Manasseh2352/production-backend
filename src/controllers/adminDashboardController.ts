import type { Request, Response, NextFunction } from "express";

import { adminAnalyticsService } from "../services/admin/adminAnalyticsService";

export const adminDashboardController = {
  async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getAnalytics();
      return res.json({ ok: true, analytics: data });
    } catch (err) {
      next(err);
    }
  },

  async statistics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getStatistics();
      return res.json({ ok: true, statistics: data });
    } catch (err) {
      next(err);
    }
  },
};

