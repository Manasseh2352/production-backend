import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminFarmerController } from "../../controllers/adminFarmerController";
import { adminPaginationQuerySchema } from "../../validators/adminCommon";

export const adminFarmersRouter = Router();

adminFarmersRouter.get(
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
  adminFarmerController.list
);

