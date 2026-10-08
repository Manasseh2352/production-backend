"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const otp_routes_1 = require("./otp.routes");
const register_routes_1 = require("./register.routes");
const login_routes_1 = require("./login.routes");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.use("/register", register_routes_1.registerRouter);
exports.authRouter.use("/login", login_routes_1.loginRouter);
exports.authRouter.use("/otp", otp_routes_1.otpRouter);
//# sourceMappingURL=index.js.map