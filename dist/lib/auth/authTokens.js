"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = exports.clearRefreshCookie = exports.setRefreshCookie = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
// Access token is intentionally long-lived for the mobile demo so sessions do
// not silently expire mid-use. A refresh endpoint also exists for correctness.
const ACCESS_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL = "30d";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const signAccessToken = (user) => jsonwebtoken_1.default.sign({ sub: user.id, role: user.role }, env_1.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
});
exports.signAccessToken = signAccessToken;
const signRefreshToken = (user) => jsonwebtoken_1.default.sign({ sub: user.id }, env_1.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
});
exports.signRefreshToken = signRefreshToken;
const setRefreshCookie = (res, refreshToken) => {
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env_1.env.NODE_ENV === "production",
        path: "/auth",
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
};
exports.setRefreshCookie = setRefreshCookie;
const clearRefreshCookie = (res) => {
    res.clearCookie("refreshToken", { path: "/auth" });
};
exports.clearRefreshCookie = clearRefreshCookie;
const toPublicUser = (user, displayName) => ({
    id: user.id,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    status: user.status,
    displayName: displayName ?? null,
});
exports.toPublicUser = toPublicUser;
//# sourceMappingURL=authTokens.js.map