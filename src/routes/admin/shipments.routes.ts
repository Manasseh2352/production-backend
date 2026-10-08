import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminShipmentController } from "../../controllers/adminShipmentController";
import { adminShipmentQuerySchema } from "../../validators/adminCommon";

export const adminShipmentsRouter = Router();

adminShipmentsRouter.get(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      (req as any).validatedQuery = adminShipmentQuerySchema.parse(req.query);
      return next();
    } catch (e) {
      return next(e);
    }
  },
  adminShipmentController.list
);

