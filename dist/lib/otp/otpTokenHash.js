"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashOtpToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Stores only a hash of the OTP token.
const hashOtpToken = (token) => {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
};
exports.hashOtpToken = hashOtpToken;
//# sourceMappingURL=otpTokenHash.js.map