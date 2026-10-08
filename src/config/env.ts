import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "",

  // AI microservice (FastAPI)
  AI_SERVICE_URL: process.env.AI_SERVICE_URL ?? "",
  AI_SERVICE_TIMEOUT_MS: process.env.AI_SERVICE_TIMEOUT_MS
    ? Number(process.env.AI_SERVICE_TIMEOUT_MS)
    : 10000,

  // Nodemailer
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 0,
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ?? "",
};


export const requireJwtSecrets = () => {
  requireEnv("JWT_ACCESS_SECRET");
  requireEnv("JWT_REFRESH_SECRET");
};

export const requireMailConfig = () => {
  requireEnv("SMTP_HOST");
  requireEnv("SMTP_PORT");
  requireEnv("SMTP_USER");
  requireEnv("SMTP_PASS");
  requireEnv("SMTP_FROM_EMAIL");
};

