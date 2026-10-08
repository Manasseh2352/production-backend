import { Router } from "express";

import { requireAdmin } from "../../admin/adminAuth";
import { adminUserController } from "../../controllers/adminUserController";
import { adminPaginationQuerySchema } from "../../validators/adminCommon";


export const adminUsersRouter = Router();

adminUsersRouter.get(
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
  adminUserController.list
);

