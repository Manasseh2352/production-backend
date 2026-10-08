import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminOrderController } from "../../controllers/adminOrderController";
import { adminOrderQuerySchema } from "../../validators/adminCommon";

export const adminOrdersRouter = Router();

adminOrdersRouter.get(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      (req as any).validatedQuery = adminOrderQuerySchema.parse(req.query);
      return next();
    } catch (e) {
      return next(e);
    }
  },
  adminOrderController.list
);

