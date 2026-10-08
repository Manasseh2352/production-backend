import type { Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";

// Access token is intentionally long-lived for the mobile demo so sessions do
// not silently expire mid-use. A refresh endpoint also exists for correctness.
const ACCESS_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL = "30d";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  displayName: string | null;
};

export const signAccessToken = (user: { id: string; role: string }) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

export const signRefreshToken = (user: { id: string }) =>
  jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

export const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refreshToken", { path: "/auth" });
};

export const toPublicUser = (
  user: { id: string; email: string; phone: string | null; role: string; status: string },
  displayName: string | null
): PublicUser => ({
  id: user.id,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
  status: user.status,
  displayName: displayName ?? null,
});
