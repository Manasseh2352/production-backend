"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutRouter = void 0;
const express_1 = require("express");
const authTokens_1 = require("../../lib/auth/authTokens");
exports.logoutRouter = (0, express_1.Router)();
// Clear the refresh cookie. The access token is stateless (JWT) so the client
// discards it locally; this endpoint invalidates the long-lived refresh cookie.
exports.logoutRouter.post("/", (_req, res) => {
    (0, authTokens_1.clearRefreshCookie)(res);
    return res.json({ ok: true });
});
//# sourceMappingURL=logout.routes.js.map