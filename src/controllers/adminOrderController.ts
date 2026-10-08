import type { Request, Response, NextFunction } from "express";

import { adminOrderService } from "../services/admin/adminOrderService";

export const adminOrderController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminOrderService.listOrders(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

