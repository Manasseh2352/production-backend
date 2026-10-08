import type { Request, Response, NextFunction } from "express";

import { adminPaymentService } from "../services/admin/adminPaymentService";

export const adminPaymentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminPaymentService.listPayments(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

