import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminProductController } from "../../controllers/adminProductController";
import { adminProductQuerySchema } from "../../validators/adminCommon";

export const adminProductsRouter = Router();

adminProductsRouter.get(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      (req as any).validatedQuery = adminProductQuerySchema.parse(req.query);
      return next();
    } catch (e) {
      return next(e);
    }
  },
  adminProductController.list
);

