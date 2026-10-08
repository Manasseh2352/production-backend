import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env, requireJwtSecrets } from "../config/env";

export type AuthUser = {
  id: string;
  role: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    requireJwtSecrets();

    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = header.slice("Bearer ".length);

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    if (!decoded?.sub) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      id: String(decoded.sub),
      role: decoded.role ? String(decoded.role) : "",
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

