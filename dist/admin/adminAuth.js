"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const authMiddleware_1 = require("../middleware/authMiddleware");
// ADMIN-only guard.
const requireAdmin = (req, res, next) => {
    // First ensure authentication.
    (0, authMiddleware_1.requireAuth)(req, res, () => {
        const role = req.user?.role;
        if (role !== "ADMIN") {
            return res.status(403).json({ error: "Forbidden" });
        }
        return next();
    });
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=adminAuth.js.map