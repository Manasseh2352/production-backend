export const generateOtp6Digit = (): string => {
  // 000000-999999; we want exactly 6 digits
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
};

