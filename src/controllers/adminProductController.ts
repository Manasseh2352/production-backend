import type { Request, Response, NextFunction } from "express";

import { adminProductService } from "../services/admin/adminProductService";

export const adminProductController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminProductService.listProducts(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

