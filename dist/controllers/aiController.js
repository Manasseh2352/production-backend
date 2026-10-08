"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const zod_1 = require("zod");
const pricePredictionService_1 = require("../services/ai/pricePredictionService");
const demandForecastingService_1 = require("../services/ai/demandForecastingService");
const profitEstimationService_1 = require("../services/ai/profitEstimationService");
const cropRecommendationService_1 = require("../services/ai/cropRecommendationService");
const shippingRecommendationService_1 = require("../services/ai/shippingRecommendationService");
const featuresSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional();
const pricePredictionSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1).optional(),
    state: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    features: featuresSchema,
});
const demandForecastingSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1).optional(),
    state: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    horizonDays: zod_1.z.number().int().positive().max(90).optional(),
    features: featuresSchema,
});
const profitEstimationSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1).optional(),
    state: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    expectedSellPrice: zod_1.z.number().nonnegative().optional(),
    expectedCost: zod_1.z.number().nonnegative().optional(),
    expectedRevenue: zod_1.z.number().nonnegative().optional(),
    currency: zod_1.z.string().optional(),
    features: featuresSchema,
});
const cropRecommendationSchema = zod_1.z.object({
    farmerProfileId: zod_1.z.string().min(1).optional(),
    state: zod_1.z.string().optional(),
    season: zod_1.z.string().optional(),
    soilType: zod_1.z.string().optional(),
    budget: zod_1.z.number().nonnegative().optional(),
    riskProfile: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    features: featuresSchema,
});
const shippingRecommendationSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1).optional(),
    destinationCountry: zod_1.z.string().optional(),
    weightKg: zod_1.z.number().nonnegative().optional(),
    shipmentType: zod_1.z.string().optional(),
    features: featuresSchema,
});
exports.aiController = {
    async pricePrediction(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const input = pricePredictionSchema.parse(req.body ?? {});
            const result = await pricePredictionService_1.pricePredictionService.predict(input);
            return res.json({ ok: true, result });
        }
        catch (err) {
            next(err);
        }
    },
    async demandForecasting(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const input = demandForecastingSchema.parse(req.body ?? {});
            const result = await demandForecastingService_1.demandForecastingService.forecast(input);
            return res.json({ ok: true, result });
        }
        catch (err) {
            next(err);
        }
    },
    async profitEstimation(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const input = profitEstimationSchema.parse(req.body ?? {});
            const result = await profitEstimationService_1.profitEstimationService.estimate(input);
            return res.json({ ok: true, result });
        }
        catch (err) {
            next(err);
        }
    },
    async cropRecommendation(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const input = cropRecommendationSchema.parse(req.body ?? {});
            const result = await cropRecommendationService_1.cropRecommendationService.recommend(input);
            return res.json({ ok: true, result });
        }
        catch (err) {
            next(err);
        }
    },
    async shippingRecommendation(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const input = shippingRecommendationSchema.parse(req.body ?? {});
            const result = await shippingRecommendationService_1.shippingRecommendationService.recommend(input);
            return res.json({ ok: true, result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=aiController.js.map