"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
// Keep this minimal but production-friendly
const errorHandler = (err, _req, res, _next) => {
    const statusCode = typeof err?.status === "number" ? err.status : 500;
    if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("[errorHandler]", err);
    }
    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal Server Error" : err?.message ?? "Error",
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map