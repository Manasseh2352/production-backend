"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitEstimationService = exports.ProfitEstimationService = void 0;
const env_1 = require("../../config/env");
const client_1 = require("../../prisma/client");
const aiHttpClient_1 = require("./aiHttpClient");
const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;
// Assumed cost-to-revenue ratio when the caller does not supply a cost.
const ASSUMED_COST_RATIO = 0.65;
class ProfitEstimationService {
    async estimate(input) {
        if (env_1.env.AI_SERVICE_URL) {
            try {
                return await aiHttpClient_1.aiHttpClient.request({
                    method: "POST",
                    path: "/profit-estimation",
                    body: input,
                });
            }
            catch {
                // fall through to local heuristic
            }
        }
        return this.estimateLocal(input);
    }
    async estimateLocal(input) {
        const currency = input.currency ?? "USD";
        let revenue = input.expectedRevenue ?? 0;
        let quantityKg = null;
        // Derive revenue from the product listing when not explicitly provided.
        if (!revenue && input.productId) {
            const product = await client_1.prisma.product.findUnique({
                where: { id: input.productId },
                select: { pricePerKg: true, quantityKg: true },
            });
            if (product) {
                const unitPrice = input.expectedSellPrice ?? Number(product.pricePerKg);
                quantityKg = Number(product.quantityKg);
                revenue = unitPrice * quantityKg;
            }
        }
        if (!revenue && input.expectedSellPrice) {
            revenue = input.expectedSellPrice;
        }
        let cost = input.expectedCost ?? null;
        let costAssumed = false;
        if (cost === null) {
            cost = revenue * ASSUMED_COST_RATIO;
            costAssumed = true;
        }
        const profit = revenue - cost;
        const margin = revenue > 0 ? profit / revenue : 0;
        return {
            estimatedProfit: round2(profit),
            currency,
            profitMargin: round4(margin),
            modelInfo: {
                engine: "local-heuristic",
                method: "revenue-minus-cost",
                revenue: round2(revenue),
                cost: round2(cost),
                costAssumed,
                ...(quantityKg !== null ? { quantityKg } : {}),
            },
        };
    }
}
exports.ProfitEstimationService = ProfitEstimationService;
exports.profitEstimationService = new ProfitEstimationService();
//# sourceMappingURL=profitEstimationService.js.map