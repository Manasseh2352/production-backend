"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userRepository_1 = require("../../repositories/userRepository");
const otpService_1 = require("../../services/otpService");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8).max(72),
});
exports.registerRouter = (0, express_1.Router)();
exports.registerRouter.post("/", async (req, res, next) => {
    try {
        const body = registerSchema.parse(req.body);
        const existing = await userRepository_1.userRepository.findByEmail(body.email);
        if (existing) {
            return res.status(409).json({ ok: false, error: "Email already in use" });
        }
        const passwordHash = await bcrypt_1.default.hash(body.password, 10);
        // Create the user first
        const user = await userRepository_1.userRepository.create({
            email: body.email,
            phone: body.phone,
            passwordHash,
            // Buyers are active on creation. Farmers require admin approval later.
            status: "ACTIVE",
        });
        // Trigger OTP for signup verification
        await otpService_1.otpService.resendOrCreateOtp({
            email: user.email,
            purpose: "SIGNUP",
        });
        return res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=register.routes.js.map