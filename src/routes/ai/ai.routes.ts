import { Router } from "express";

import { requireAuth } from "../../middleware/authMiddleware";
import { aiController } from "../../controllers/aiController";

export const aiRouter = Router();

// AI-assisted capabilities. Each endpoint uses the external ML microservice
// when AI_SERVICE_URL is configured, and transparently falls back to a local
// heuristic computed from our own data otherwise.
aiRouter.post("/price-prediction", requireAuth, aiController.pricePrediction);
aiRouter.post("/demand-forecasting", requireAuth, aiController.demandForecasting);
aiRouter.post("/profit-estimation", requireAuth, aiController.profitEstimation);
aiRouter.post("/crop-recommendation", requireAuth, aiController.cropRecommendation);
aiRouter.post(
  "/shipping-recommendation",
  requireAuth,
  aiController.shippingRecommendation
);
