import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";

import { requireJwtSecrets } from "../../config/env";
import { userRepository } from "../../repositories/userRepository";
import { buyerRepository } from "../../repositories/buyerRepository";
import { farmerRepository } from "../../repositories/farmerRepository";
import { otpService } from "../../services/otpService";

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(3).max(32).optional(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(120),
  role: z.enum(["BUYER", "FARMER"]).optional().default("BUYER"),
  // Optional farmer-only fields; ignored for buyers.
  farmName: z.string().min(2).max(120).optional(),
  location: z.string().min(2).max(160).optional(),
});

type RegisterBody = z.infer<typeof registerSchema>;

export const registerRouter = Router();

registerRouter.post("/", async (req, res, next) => {
  try {
    requireJwtSecrets();

    const body: RegisterBody = registerSchema.parse(req.body);

    const existing = await userRepository.findByEmail(body.email);
    if (existing) {
      return res.status(409).json({ ok: false, error: "Email already in use" });
    }

    // Phone is unique in the schema. Check it explicitly so a duplicate returns
    // a clean 409 instead of a Prisma P2002 that would surface as a 500.
    if (body.phone) {
      const existingPhone = await userRepository.findByPhone(body.phone);
      if (existingPhone) {
        return res
          .status(409)
          .json({ ok: false, error: "Phone number already in use" });
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    // Hard gate: create the account as PENDING. It stays unusable until the
    // SIGNUP OTP is verified (which flips it to ACTIVE). No access token is
    // issued here — the client must verify the OTP and then log in.
    const user = await userRepository.create({
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: body.role,
      status: "PENDING",
    });

    // Create the role-matching profile so profile-dependent flows (orders,
    // dashboards, product uploads) work immediately.
    if (body.role === "FARMER") {
      await farmerRepository.createProfile({
        userId: user.id,
        displayName: body.fullName,
        farmName: body.farmName ?? null,
        location: body.location ?? null,
      });
    } else {
      await buyerRepository.createProfile({
        userId: user.id,
        displayName: body.fullName,
      });
    }

    // Fire signup OTP but never block registration on email delivery; the
    // /auth/otp/resend endpoint backs this up if delivery fails.
    otpService
      .resendOrCreateOtp({ email: user.email, purpose: "SIGNUP" })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[register] failed to send signup OTP:", err?.message ?? err);
      });

    // No token at registration under the hard gate: the client routes to the
    // OTP screen, verifies (PENDING -> ACTIVE), then logs in to obtain tokens.
    return res.status(201).json({
      ok: true,
      otpRequired: true,
      purpose: "SIGNUP",
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
});
