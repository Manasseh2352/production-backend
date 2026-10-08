import type { Request, Response, NextFunction } from "express";

import { adminBuyerService } from "../services/admin/adminBuyerService";

export const adminBuyerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminBuyerService.listBuyers(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

