import type { NextFunction, Request, Response } from "express";

import { requireAuth } from "../middleware/authMiddleware";

// ADMIN-only guard.
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First ensure authentication.
  requireAuth(req, res, () => {
    const role = req.user?.role;
    if (role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  });
};

