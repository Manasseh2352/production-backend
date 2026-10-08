"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../../config/env");
const userRepository_1 = require("../../repositories/userRepository");
const otpService_1 = require("../../services/otpService");
const authTokens_1 = require("../../lib/auth/authTokens");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.loginRouter = (0, express_1.Router)();
exports.loginRouter.post("/", async (req, res, next) => {
    try {
        (0, env_1.requireJwtSecrets)();
        const body = loginSchema.parse(req.body);
        const found = await userRepository_1.userRepository.findByEmail(body.email);
        if (!found)
            return res.status(401).json({ ok: false, error: "Invalid credentials" });
        // Verify the password before revealing anything about account state, so a
        // wrong password can't be used to probe whether an account exists.
        const ok = await bcrypt_1.default.compare(body.password, found.passwordHash);
        if (!ok)
            return res.status(401).json({ ok: false, error: "Invalid credentials" });
        // Hard gate: a PENDING (unverified) account can't log in yet. Re-fire a
        // LOGIN OTP and tell the client to route to the OTP screen; verifying it
        // flips the account ACTIVE, after which the next login attempt succeeds.
        if (found.status === "PENDING") {
            otpService_1.otpService
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
        const withProfiles = await userRepository_1.userRepository.findByIdWithProfiles(found.id);
        const displayName = withProfiles?.farmerProfile?.displayName ??
            withProfiles?.buyerProfile?.displayName ??
            null;
        const accessToken = (0, authTokens_1.signAccessToken)(found);
        const refreshToken = (0, authTokens_1.signRefreshToken)(found);
        (0, authTokens_1.setRefreshCookie)(res, refreshToken);
        res.json({
            ok: true,
            accessToken,
            user: (0, authTokens_1.toPublicUser)(found, displayName),
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=login.routes.js.map