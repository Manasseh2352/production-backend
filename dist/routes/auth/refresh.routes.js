"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshRouter = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const userRepository_1 = require("../../repositories/userRepository");
const authTokens_1 = require("../../lib/auth/authTokens");
exports.refreshRouter = (0, express_1.Router)();
// Exchange a valid refresh cookie for a fresh access token (and a rotated
// refresh cookie). Mirrors the token issuance in login/register.
exports.refreshRouter.post("/", async (req, res, next) => {
    try {
        (0, env_1.requireJwtSecrets)();
        const cookies = req.cookies ?? {};
        const token = cookies.refreshToken;
        if (!token) {
            return res
                .status(401)
                .json({ ok: false, error: "Missing refresh token" });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
        }
        catch {
            (0, authTokens_1.clearRefreshCookie)(res);
            return res
                .status(401)
                .json({ ok: false, error: "Invalid or expired refresh token" });
        }
        if (!decoded?.sub) {
            (0, authTokens_1.clearRefreshCookie)(res);
            return res.status(401).json({ ok: false, error: "Invalid refresh token" });
        }
        const user = await userRepository_1.userRepository.findByIdWithProfiles(String(decoded.sub));
        if (!user) {
            (0, authTokens_1.clearRefreshCookie)(res);
            return res
                .status(401)
                .json({ ok: false, error: "User no longer exists" });
        }
        const displayName = user.farmerProfile?.displayName ?? user.buyerProfile?.displayName ?? null;
        const accessToken = (0, authTokens_1.signAccessToken)(user);
        const refreshToken = (0, authTokens_1.signRefreshToken)(user);
        (0, authTokens_1.setRefreshCookie)(res, refreshToken);
        return res.json({
            ok: true,
            accessToken,
            user: (0, authTokens_1.toPublicUser)(user, displayName),
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=refresh.routes.js.map