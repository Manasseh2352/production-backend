"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../../config/env");
const userRepository_1 = require("../../repositories/userRepository");
const buyerRepository_1 = require("../../repositories/buyerRepository");
const farmerRepository_1 = require("../../repositories/farmerRepository");
const otpService_1 = require("../../services/otpService");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(3).max(32).optional(),
    password: zod_1.z.string().min(8).max(72),
    fullName: zod_1.z.string().min(2).max(120),
    role: zod_1.z.enum(["BUYER", "FARMER"]).optional().default("BUYER"),
    // Optional farmer-only fields; ignored for buyers.
    farmName: zod_1.z.string().min(2).max(120).optional(),
    location: zod_1.z.string().min(2).max(160).optional(),
});
exports.registerRouter = (0, express_1.Router)();
exports.registerRouter.post("/", async (req, res, next) => {
    try {
        (0, env_1.requireJwtSecrets)();
        const body = registerSchema.parse(req.body);
        const existing = await userRepository_1.userRepository.findByEmail(body.email);
        if (existing) {
            return res.status(409).json({ ok: false, error: "Email already in use" });
        }
        // Phone is unique in the schema. Check it explicitly so a duplicate returns
        // a clean 409 instead of a Prisma P2002 that would surface as a 500.
        if (body.phone) {
            const existingPhone = await userRepository_1.userRepository.findByPhone(body.phone);
            if (existingPhone) {
                return res
                    .status(409)
                    .json({ ok: false, error: "Phone number already in use" });
            }
        }
        const passwordHash = await bcrypt_1.default.hash(body.password, 10);
        // Hard gate: create the account as PENDING. It stays unusable until the
        // SIGNUP OTP is verified (which flips it to ACTIVE). No access token is
        // issued here — the client must verify the OTP and then log in.
        const user = await userRepository_1.userRepository.create({
            email: body.email,
            phone: body.phone,
            passwordHash,
            role: body.role,
            status: "PENDING",
        });
        // Create the role-matching profile so profile-dependent flows (orders,
        // dashboards, product uploads) work immediately.
        if (body.role === "FARMER") {
            await farmerRepository_1.farmerRepository.createProfile({
                userId: user.id,
                displayName: body.fullName,
                farmName: body.farmName ?? null,
                location: body.location ?? null,
            });
        }
        else {
            await buyerRepository_1.buyerRepository.createProfile({
                userId: user.id,
                displayName: body.fullName,
            });
        }
        // Fire signup OTP but never block registration on email delivery; the
        // /auth/otp/resend endpoint backs this up if delivery fails.
        otpService_1.otpService
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
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=register.routes.js.map