"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const otpService_1 = require("../../services/otpService");
const resendSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    purpose: zod_1.z.enum(["LOGIN", "SIGNUP", "PASSWORD_RESET", "PHONE_VERIFICATION"]),
});
exports.otpRouter = (0, express_1.Router)();
exports.otpRouter.post("/resend", async (req, res, next) => {
    try {
        const body = resendSchema.parse(req.body);
        const result = await otpService_1.otpService.resendOrCreateOtp({
            email: body.email,
            purpose: body.purpose,
        });
        res.json({ ok: true, ...result });
    }
    catch (err) {
        next(err);
    }
});
const verifySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    purpose: zod_1.z.enum(["LOGIN", "SIGNUP", "PASSWORD_RESET", "PHONE_VERIFICATION"]),
    otp: zod_1.z.string().regex(/^\d{6}$/),
});
exports.otpRouter.post("/verify", async (req, res, next) => {
    try {
        const body = verifySchema.parse(req.body);
        const result = await otpService_1.otpService.verifyOtp({
            email: body.email,
            purpose: body.purpose,
            otp: body.otp,
        });
        // Signup OTP => activate user
        if (body.purpose === "SIGNUP") {
            await otpService_1.otpService.activateUserAfterSignupOtp({ email: body.email });
        }
        res.json({ ok: true, ...result });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=otp.routes.js.map