import { sendOtpEmail } from "../lib/mail/sendOtpEmail";
import { generateOtp6Digit } from "../lib/otp/otpGenerator";
import { hashOtpToken } from "../lib/otp/otpTokenHash";
import { otpRepository } from "../repositories/otpRepository";
import { userRepository } from "../repositories/userRepository";

type OTPPurpose = "LOGIN" | "SIGNUP" | "PASSWORD_RESET" | "PHONE_VERIFICATION";

type OTPChannel = "EMAIL" | "SMS";

const OTP_TTL_MS = 10 * 60 * 1000;

const purposeToLabel: Record<string, string> = {
  LOGIN: "login",
  SIGNUP: "sign up",
  PASSWORD_RESET: "password reset",
  PHONE_VERIFICATION: "phone verification",
};

const SHOULD_BYPASS_OTP_IN_DEV = process.env.OTP_DEBUG_BYPASS === "true";
const DEBUG_BYPASS_CODE = process.env.OTP_DEBUG_BYPASS_CODE ?? "123456";

export const otpService = {
  async resendOrCreateOtp(params: { email: string; purpose: OTPPurpose }) {
    const user = await userRepository.requireByEmail(params.email);

    // Remove any previous OTPs for this purpose (keeps db clean)
    await otpRepository.deleteActiveByUserAndPurpose({
      userId: user.id,
      purpose: params.purpose,
    });

    const otp = SHOULD_BYPASS_OTP_IN_DEV ? DEBUG_BYPASS_CODE : generateOtp6Digit();
    const tokenHash = hashOtpToken(otp);

    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Store OTP
    await otpRepository.create({
      userId: user.id,
      purpose: params.purpose,
      channel: "EMAIL" as OTPChannel,
      tokenHash,
      expiresAt,
    });

    // Send OTP (still do it unless explicitly bypassing)
    if (!SHOULD_BYPASS_OTP_IN_DEV) {
      await sendOtpEmail({
        toEmail: user.email,
        otp,
        purposeLabel: purposeToLabel[params.purpose] ?? "verification",
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(`[otp][debug] bypass enabled. OTP for ${params.email} (${params.purpose}) = ${otp}`);
    }

    return { expiresAt };
  },

  async verifyOtp(params: {
    email: string;
    purpose: OTPPurpose;
    otp: string;
  }) {
    const user = await userRepository.requireByEmail(params.email);

    // Allow deterministic debug OTP code
    if (SHOULD_BYPASS_OTP_IN_DEV && params.otp === DEBUG_BYPASS_CODE) {
      const tokenHash = hashOtpToken(params.otp);
      const otpRow = await otpRepository.findValidByUserPurposeToken({
        userId: user.id,
        purpose: params.purpose,
        tokenHash,
      });

      if (!otpRow) {
        throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
      }

      await otpRepository.consumeAndDelete({ otpId: otpRow.id });
      return { verified: true };
    }

    const tokenHash = hashOtpToken(params.otp);

    // Validate OTP
    const otpRow = await otpRepository.findValidByUserPurposeToken({
      userId: user.id,
      purpose: params.purpose,
      tokenHash,
    });

    if (!otpRow) {
      throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
    }

    // Delete after successful verification
    await otpRepository.consumeAndDelete({ otpId: otpRow.id });

    return { verified: true };
  },

  async activatePendingUser(params: { email: string }) {
    const user = await userRepository.requireByEmail(params.email);

    if (user.status === "ACTIVE") return { activated: true };

    await userRepository.updateStatusById({
      userId: user.id,
      status: "ACTIVE",
    });

    return { activated: true };
  },
};




