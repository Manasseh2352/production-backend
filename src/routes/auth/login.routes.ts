import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";

import { requireJwtSecrets } from "../../config/env";
import { userRepository } from "../../repositories/userRepository";
import { otpService } from "../../services/otpService";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  toPublicUser,
} from "../../lib/auth/authTokens";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginBody = z.infer<typeof loginSchema>;

export const loginRouter = Router();

loginRouter.post("/", async (req, res, next) => {
  try {
    requireJwtSecrets();

    const body: LoginBody = loginSchema.parse(req.body);

    const found = await userRepository.findByEmail(body.email);
    if (!found) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    // Verify the password before revealing anything about account state, so a
    // wrong password can't be used to probe whether an account exists.
    const ok = await bcrypt.compare(body.password, found.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    // Hard gate: a PENDING (unverified) account can't log in yet. Re-fire a
    // LOGIN OTP and tell the client to route to the OTP screen; verifying it
    // flips the account ACTIVE, after which the next login attempt succeeds.
    if (found.status === "PENDING") {
      otpService
        .resendOrCreateOtp({ email: found.email, purpose: "LOGIN" })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[login] failed to send login OTP:", err?.message ?? err);
        });
      return res.status(403).json({
        ok: false,
        otpRequired: true,
        purpose: "LOGIN",
        email: found.email,
      });
    }

    // Any other non-active state (e.g. SUSPENDED) is blocked outright.
    if (found.status !== "ACTIVE") {
      return res.status(403).json({ ok: false, error: "Account is not active" });
    }

    // Resolve display name from the role-matching profile for the client.
    const withProfiles = await userRepository.findByIdWithProfiles(found.id);
    const displayName =
      withProfiles?.farmerProfile?.displayName ??
      withProfiles?.buyerProfile?.displayName ??
      null;

    const accessToken = signAccessToken(found);
    const refreshToken = signRefreshToken(found);
    setRefreshCookie(res, refreshToken);

    res.json({
      ok: true,
      accessToken,
      user: toPublicUser(found, displayName),
    });
  } catch (err) {
    next(err);
  }
});
