import type { Request, Response, NextFunction } from "express";

import { adminUserService } from "../services/admin/adminUserService";

export const adminUserController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).validatedQuery as any;
      const result = await adminUserService.listUsers(query);
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

