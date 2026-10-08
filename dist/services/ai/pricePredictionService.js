"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricePredictionService = exports.PricePredictionService = void 0;
const env_1 = require("../../config/env");
const client_1 = require("../../prisma/client");
const aiHttpClient_1 = require("./aiHttpClient");
const round2 = (n) => Math.round(n * 100) / 100;
// Fallback price used when there is no listing/market data at all.
const DEFAULT_PRICE_PER_KG = 600;
class PricePredictionService {
    async predict(input) {
        // Prefer the external ML microservice when configured; otherwise (or if it
        // fails) fall back to a local heuristic computed from our own data so the
        // feature always returns a usable answer for the demo.
        if (env_1.env.AI_SERVICE_URL) {
            try {
                return await aiHttpClient_1.aiHttpClient.request({
                    method: "POST",
                    path: "/price-prediction",
                    body: input,
                });
            }
            catch {
                // fall through to local heuristic
            }
        }
        return this.predictLocal(input);
    }
    async predictLocal(input) {
        const currency = input.currency ?? "USD";
        let method = "market-average";
        let samples = 0;
        let predicted = null;
        if (input.productId) {
            const history = await client_1.prisma.marketPrice.findMany({
                where: { productId: input.productId },
                orderBy: { recordedAt: "asc" },
                take: 60,
                select: { price: true },
            });
            samples = history.length;
            if (history.length >= 2) {
                const prices = history.map((h) => Number(h.price));
                // Average of the most recent step changes → simple linear trend.
                const steps = [];
                for (let i = 1; i < prices.length; i++) {
                    steps.push(prices[i] - prices[i - 1]);
                }
                const recentSteps = steps.slice(-6);
                const avgStep = recentSteps.reduce((a, b) => a + b, 0) / recentSteps.length;
                predicted = prices[prices.length - 1] + avgStep;
                method = "linear-trend";
            }
            else if (history.length === 1) {
                predicted = Number(history[0].price);
                method = "last-known";
            }
            if (predicted === null) {
                const product = await client_1.prisma.product.findUnique({
                    where: { id: input.productId },
                    select: { pricePerKg: true },
                });
                if (product) {
                    predicted = Number(product.pricePerKg);
                    method = "current-listing";
                }
            }
        }
        if (predicted === null) {
            const agg = await client_1.prisma.product.aggregate({
                _avg: { pricePerKg: true },
                where: { status: "ACTIVE" },
            });
            if (agg._avg.pricePerKg !== null) {
                predicted = Number(agg._avg.pricePerKg);
                method = "market-average";
            }
        }
        if (predicted === null || !Number.isFinite(predicted) || predicted <= 0) {
            predicted = DEFAULT_PRICE_PER_KG;
            method = "default";
        }
        return {
            predictedPrice: round2(predicted),
            currency,
            horizon: "next-cycle",
            modelInfo: { engine: "local-heuristic", method, samples },
        };
    }
}
exports.PricePredictionService = PricePredictionService;
exports.pricePredictionService = new PricePredictionService();
//# sourceMappingURL=pricePredictionService.js.map