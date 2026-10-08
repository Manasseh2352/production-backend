"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp6Digit = void 0;
const generateOtp6Digit = () => {
    // 000000-999999; we want exactly 6 digits
    const n = Math.floor(Math.random() * 1_000_000);
    return String(n).padStart(6, "0");
};
exports.generateOtp6Digit = generateOtp6Digit;
//# sourceMappingURL=otpGenerator.js.map