"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
// Keep this minimal but production-friendly
const errorHandler = (err, _req, res, _next) => {
    if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("[errorHandler]", err);
    }
    // Request-body validation failures are client errors (400), not server crashes.
    // Return the first field message so clients can surface something meaningful.
    if (err instanceof zod_1.ZodError) {
        const first = err.issues[0];
        const field = first?.path.join(".");
        return res.status(400).json({
            error: field ? `${field}: ${first.message}` : first?.message ?? "Invalid request",
            fields: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
    }
    // Prisma unique-constraint violations (P2002) are client conflicts (409),
    // not server crashes. This is a safety net for any unique field (email,
    // phone, SKU, tracking number, …) and covers races the route checks can miss.
    if (err && typeof err === "object" && err.code === "P2002") {
        const target = err?.meta?.target;
        const field = Array.isArray(target) ? target[0] : target;
        return res.status(409).json({
            error: field ? `${field} already in use` : "Already exists",
        });
    }
    const statusCode = typeof err?.status === "number" ? err.status : 500;
    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal Server Error" : err?.message ?? "Error",
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map