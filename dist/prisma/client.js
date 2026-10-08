"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Standard Prisma client singleton.
// This repo previously tried to conditionally create Prisma based on
// PRISMA_ACCELERATE_URL, which resulted in `prisma` being null at runtime.
//
// For backend connectivity (auth/register etc.), we always export a working
// PrismaClient instance.
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=client.js.map