import type { Request, Response, NextFunction } from "express";

import { adminFarmerService } from "../services/admin/adminFarmerService";

export const adminFarmerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminFarmerService.listFarmers(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

