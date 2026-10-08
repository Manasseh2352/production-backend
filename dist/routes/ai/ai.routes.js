"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const aiController_1 = require("../../controllers/aiController");
exports.aiRouter = (0, express_1.Router)();
// AI-assisted capabilities. Each endpoint uses the external ML microservice
// when AI_SERVICE_URL is configured, and transparently falls back to a local
// heuristic computed from our own data otherwise.
exports.aiRouter.post("/price-prediction", authMiddleware_1.requireAuth, aiController_1.aiController.pricePrediction);
exports.aiRouter.post("/demand-forecasting", authMiddleware_1.requireAuth, aiController_1.aiController.demandForecasting);
exports.aiRouter.post("/profit-estimation", authMiddleware_1.requireAuth, aiController_1.aiController.profitEstimation);
exports.aiRouter.post("/crop-recommendation", authMiddleware_1.requireAuth, aiController_1.aiController.cropRecommendation);
exports.aiRouter.post("/shipping-recommendation", authMiddleware_1.requireAuth, aiController_1.aiController.shippingRecommendation);
//# sourceMappingURL=ai.routes.js.map