"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMailConfig = exports.requireJwtSecrets = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requireEnv = (key) => {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required env var: ${key}`);
    return val;
};
exports.env = {
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
const requireJwtSecrets = () => {
    requireEnv("JWT_ACCESS_SECRET");
    requireEnv("JWT_REFRESH_SECRET");
};
exports.requireJwtSecrets = requireJwtSecrets;
const requireMailConfig = () => {
    requireEnv("SMTP_HOST");
    requireEnv("SMTP_PORT");
    requireEnv("SMTP_USER");
    requireEnv("SMTP_PASS");
    requireEnv("SMTP_FROM_EMAIL");
};
exports.requireMailConfig = requireMailConfig;
//# sourceMappingURL=env.js.map