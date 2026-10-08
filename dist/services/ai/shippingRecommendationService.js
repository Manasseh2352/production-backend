"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingRecommendationService = exports.ShippingRecommendationService = void 0;
const env_1 = require("../../config/env");
const client_1 = require("../../prisma/client");
const aiHttpClient_1 = require("./aiHttpClient");
const round2 = (n) => Math.round(n * 100) / 100;
// Weight (kg) at/above which a full-container load is recommended.
const FCL_THRESHOLD_KG = 10000;
class ShippingRecommendationService {
    async recommend(input) {
        if (env_1.env.AI_SERVICE_URL) {
            try {
                return await aiHttpClient_1.aiHttpClient.request({
                    method: "POST",
                    path: "/shipping-recommendation",
                    body: input,
                });
            }
            catch {
                // fall through to local heuristic
            }
        }
        return this.recommendLocal(input);
    }
    // Rule-based shipping recommendation. Weight is taken from the input, or
    // estimated from the order's shipped items when only an orderId is given.
    async recommendLocal(input) {
        let weightKg = input.weightKg ?? 0;
        if (!weightKg && input.orderId) {
            const groups = await client_1.prisma.shipmentGroup.findMany({
                where: { orderId: input.orderId },
                select: { items: { select: { quantity: true, unit: true } } },
            });
            for (const g of groups) {
                for (const it of g.items) {
                    if ((it.unit ?? "kg").toLowerCase() === "kg") {
                        weightKg += Number(it.quantity);
                    }
                }
            }
        }
        const shipmentType = input.shipmentType ?? (weightKg >= FCL_THRESHOLD_KG ? "FCL" : "LCL");
        const isFcl = shipmentType === "FCL";
        const costEstimate = isFcl ? 2500 : round2(50 + 0.15 * weightKg);
        const etaDays = isFcl ? 28 : 35;
        return {
            recommendation: {
                shipmentType,
                recommendedCarrier: isFcl
                    ? "Ocean FCL Carrier"
                    : "Consolidated LCL Freight",
                etaDays,
                costEstimate,
                currency: "USD",
                notes: input.destinationCountry
                    ? `Estimate to ${input.destinationCountry} based on ${round2(weightKg)}kg.`
                    : `Estimate based on ${round2(weightKg)}kg.`,
            },
            modelInfo: {
                engine: "local-heuristic",
                method: "rule-based",
                weightKg: round2(weightKg),
            },
        };
    }
}
exports.ShippingRecommendationService = ShippingRecommendationService;
exports.shippingRecommendationService = new ShippingRecommendationService();
//# sourceMappingURL=shippingRecommendationService.js.map