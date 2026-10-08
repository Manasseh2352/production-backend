import { Router } from "express";
import jwt from "jsonwebtoken";

import { env, requireJwtSecrets } from "../../config/env";
import { userRepository } from "../../repositories/userRepository";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  toPublicUser,
} from "../../lib/auth/authTokens";

export const refreshRouter = Router();

// Exchange a valid refresh cookie for a fresh access token (and a rotated
// refresh cookie). Mirrors the token issuance in login/register.
refreshRouter.post("/", async (req, res, next) => {
  try {
    requireJwtSecrets();

    const cookies = (req as any).cookies ?? {};
    const token = cookies.refreshToken as string | undefined;
    if (!token) {
      return res
        .status(401)
        .json({ ok: false, error: "Missing refresh token" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
      clearRefreshCookie(res);
      return res
        .status(401)
        .json({ ok: false, error: "Invalid or expired refresh token" });
    }

    if (!decoded?.sub) {
      clearRefreshCookie(res);
      return res.status(401).json({ ok: false, error: "Invalid refresh token" });
    }

    const user = await userRepository.findByIdWithProfiles(String(decoded.sub));
    if (!user) {
      clearRefreshCookie(res);
      return res
        .status(401)
        .json({ ok: false, error: "User no longer exists" });
    }

    const displayName =
      user.farmerProfile?.displayName ?? user.buyerProfile?.displayName ?? null;

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.json({
      ok: true,
      accessToken,
      user: toPublicUser(user, displayName),
    });
  } catch (err) {
    next(err);
  }
});
