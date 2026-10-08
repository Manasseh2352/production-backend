import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminBuyerController } from "../../controllers/adminBuyerController";
import { adminPaginationQuerySchema } from "../../validators/adminCommon";

export const adminBuyersRouter = Router();

adminBuyersRouter.get(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      (req as any).validatedQuery = adminPaginationQuerySchema.parse(req.query);
      return next();
    } catch (e) {
      return next(e);
    }
  },
  adminBuyerController.list
);

