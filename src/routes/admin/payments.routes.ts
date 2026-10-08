import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminPaymentController } from "../../controllers/adminPaymentController";
import { adminPaymentQuerySchema } from "../../validators/adminCommon";

export const adminPaymentsRouter = Router();

adminPaymentsRouter.get(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      (req as any).validatedQuery = adminPaymentQuerySchema.parse(req.query);
      return next();
    } catch (e) {
      return next(e);
    }
  },
  adminPaymentController.list
);

