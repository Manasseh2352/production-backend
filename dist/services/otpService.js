"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = void 0;
const sendOtpEmail_1 = require("../lib/mail/sendOtpEmail");
const otpGenerator_1 = require("../lib/otp/otpGenerator");
const otpTokenHash_1 = require("../lib/otp/otpTokenHash");
const otpRepository_1 = require("../repositories/otpRepository");
const userRepository_1 = require("../repositories/userRepository");
const OTP_TTL_MS = 10 * 60 * 1000;
const purposeToLabel = {
    LOGIN: "login",
    SIGNUP: "sign up",
    PASSWORD_RESET: "password reset",
    PHONE_VERIFICATION: "phone verification",
};
const SHOULD_BYPASS_OTP_IN_DEV = process.env.OTP_DEBUG_BYPASS === "true";
const DEBUG_BYPASS_CODE = process.env.OTP_DEBUG_BYPASS_CODE ?? "123456";
exports.otpService = {
    async resendOrCreateOtp(params) {
        const user = await userRepository_1.userRepository.requireByEmail(params.email);
        // Remove any previous OTPs for this purpose (keeps db clean)
        await otpRepository_1.otpRepository.deleteActiveByUserAndPurpose({
            userId: user.id,
            purpose: params.purpose,
        });
        const otp = SHOULD_BYPASS_OTP_IN_DEV ? DEBUG_BYPASS_CODE : (0, otpGenerator_1.generateOtp6Digit)();
        const tokenHash = (0, otpTokenHash_1.hashOtpToken)(otp);
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        // Store OTP
        await otpRepository_1.otpRepository.create({
            userId: user.id,
            purpose: params.purpose,
            channel: "EMAIL",
            tokenHash,
            expiresAt,
        });
        // Send OTP (still do it unless explicitly bypassing)
        if (!SHOULD_BYPASS_OTP_IN_DEV) {
            await (0, sendOtpEmail_1.sendOtpEmail)({
                toEmail: user.email,
                otp,
                purposeLabel: purposeToLabel[params.purpose] ?? "verification",
            });
        }
        else {
            // eslint-disable-next-line no-console
            console.log(`[otp][debug] bypass enabled. OTP for ${params.email} (${params.purpose}) = ${otp}`);
        }
        return { expiresAt };
    },
    async verifyOtp(params) {
        const user = await userRepository_1.userRepository.requireByEmail(params.email);
        // Allow deterministic debug OTP code
        if (SHOULD_BYPASS_OTP_IN_DEV && params.otp === DEBUG_BYPASS_CODE) {
            const tokenHash = (0, otpTokenHash_1.hashOtpToken)(params.otp);
            const otpRow = await otpRepository_1.otpRepository.findValidByUserPurposeToken({
                userId: user.id,
                purpose: params.purpose,
                tokenHash,
            });
            if (!otpRow) {
                throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
            }
            await otpRepository_1.otpRepository.consumeAndDelete({ otpId: otpRow.id });
            return { verified: true };
        }
        const tokenHash = (0, otpTokenHash_1.hashOtpToken)(params.otp);
        // Validate OTP
        const otpRow = await otpRepository_1.otpRepository.findValidByUserPurposeToken({
            userId: user.id,
            purpose: params.purpose,
            tokenHash,
        });
        if (!otpRow) {
            throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
        }
        // Delete after successful verification
        await otpRepository_1.otpRepository.consumeAndDelete({ otpId: otpRow.id });
        return { verified: true };
    },
    async activateUserAfterSignupOtp(params) {
        const user = await userRepository_1.userRepository.requireByEmail(params.email);
        if (user.status === "ACTIVE")
            return { activated: true };
        await userRepository_1.userRepository.updateStatusById({
            userId: user.id,
            status: "ACTIVE",
        });
        return { activated: true };
    },
};
//# sourceMappingURL=otpService.js.map