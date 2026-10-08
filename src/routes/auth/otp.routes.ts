import { Router } from "express";
import { z } from "zod";

import { otpService } from "../../services/otpService";

type OTPPurpose = "LOGIN" | "SIGNUP" | "PASSWORD_RESET" | "PHONE_VERIFICATION";

const resendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["LOGIN", "SIGNUP", "PASSWORD_RESET", "PHONE_VERIFICATION"]),
});

type ResendBody = z.infer<typeof resendSchema>;

export const otpRouter = Router();

otpRouter.post("/resend", async (req, res, next) => {
  try {
    const body: ResendBody = resendSchema.parse(req.body);

    const result = await otpService.resendOrCreateOtp({
      email: body.email,
      purpose: body.purpose as OTPPurpose,
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

const verifySchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["LOGIN", "SIGNUP", "PASSWORD_RESET", "PHONE_VERIFICATION"]),
  otp: z.string().regex(/^\d{6}$/),
});

type VerifyBody = z.infer<typeof verifySchema>;

otpRouter.post("/verify", async (req, res, next) => {
  try {
    const body: VerifyBody = verifySchema.parse(req.body);

    const result = await otpService.verifyOtp({
      email: body.email,
      purpose: body.purpose as OTPPurpose,
      otp: body.otp,
    });

    // SIGNUP and LOGIN OTPs both gate a PENDING account; verifying either
    // flips it ACTIVE (no-op if already active).
    if (body.purpose === "SIGNUP" || body.purpose === "LOGIN") {
      await otpService.activatePendingUser({ email: body.email });
    }

    res.json({ ok: true, ...result });

  } catch (err) {
    next(err);
  }
});

