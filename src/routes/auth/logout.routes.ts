import { Router } from "express";

import { clearRefreshCookie } from "../../lib/auth/authTokens";

export const logoutRouter = Router();

// Clear the refresh cookie. The access token is stateless (JWT) so the client
// discards it locally; this endpoint invalidates the long-lived refresh cookie.
logoutRouter.post("/", (_req, res) => {
  clearRefreshCookie(res);
  return res.json({ ok: true });
});
