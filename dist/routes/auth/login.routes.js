"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const userRepository_1 = require("../../repositories/userRepository");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.loginRouter = (0, express_1.Router)();
exports.loginRouter.post("/", async (req, res, next) => {
    try {
        (0, env_1.requireJwtSecrets)();
        const body = loginSchema.parse(req.body);
        const user = await userRepository_1.userRepository.findByEmail(body.email);
        if (!user)
            return res.status(401).json({ ok: false, error: "Invalid credentials" });
        // Farmers require admin approval before login; buyers can login immediately after creation.
        if (user.role === "FARMER" && user.status !== "ACTIVE") {
            return res.status(403).json({ ok: false, error: "Account is not active" });
        }
        const ok = await bcrypt_1.default.compare(body.password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ ok: false, error: "Invalid credentials" });
        const accessToken = jsonwebtoken_1.default.sign({ sub: user.id, role: user.role }, env_1.env.JWT_ACCESS_SECRET, {
            expiresIn: "15m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: user.id }, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: "30d",
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: env_1.env.NODE_ENV === "production",
            path: "/auth/refresh",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.json({ ok: true, accessToken });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=login.routes.js.map