"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceRouter = void 0;
const express_1 = require("express");
const marketPriceController_1 = require("../../controllers/marketPriceController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
exports.marketPriceRouter = (0, express_1.Router)();
// For now, keep these protected (typically admin-only in real systems).
exports.marketPriceRouter.post("/", authMiddleware_1.requireAuth, marketPriceController_1.marketPriceController.add);
exports.marketPriceRouter.patch("/:id", authMiddleware_1.requireAuth, marketPriceController_1.marketPriceController.update);
exports.marketPriceRouter.get("/current", authMiddleware_1.requireAuth, marketPriceController_1.marketPriceController.getCurrent);
//# sourceMappingURL=marketPrice.routes.js.map