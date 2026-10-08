import crypto from "crypto";

// Stores only a hash of the OTP token.
export const hashOtpToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

