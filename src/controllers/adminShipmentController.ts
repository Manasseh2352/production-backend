import type { Request, Response, NextFunction } from "express";

import { adminShipmentService } from "../services/admin/adminShipmentService";

export const adminShipmentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminShipmentService.listShipments(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

