"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropRecommendationService = exports.CropRecommendationService = void 0;
const env_1 = require("../../config/env");
const client_1 = require("../../prisma/client");
const aiHttpClient_1 = require("./aiHttpClient");
const productTypes_1 = require("../../constants/productTypes");
const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;
// The restricted non-perishable tubers, ranked below by market value.
const CROP_TYPES = [...productTypes_1.PRODUCT_TYPES];
class CropRecommendationService {
    async recommend(input) {
        if (env_1.env.AI_SERVICE_URL) {
            try {
                return await aiHttpClient_1.aiHttpClient.request({
                    method: "POST",
                    path: "/crop-recommendation",
                    body: input,
                });
            }
            catch {
                // fall through to local heuristic
            }
        }
        return this.recommendLocal(input);
    }
    // Rank the restricted tuber crops by average active-listing price, so the
    // recommendation reflects current market value in our own catalog.
    async recommendLocal(_input) {
        const stats = await Promise.all(CROP_TYPES.map(async (t) => {
            const agg = await client_1.prisma.product.aggregate({
                _avg: { pricePerKg: true },
                _count: true,
                where: { status: "ACTIVE", productName: t },
            });
            const avgPrice = agg._avg.pricePerKg !== null
                ? Number(agg._avg.pricePerKg)
                : productTypes_1.DEFAULT_PRICE_PER_KG[t];
            return { cropName: t, avgPrice, listings: agg._count };
        }));
        const maxPrice = Math.max(...stats.map((s) => s.avgPrice), 1);
        const ranked = [...stats].sort((a, b) => b.avgPrice - a.avgPrice);
        return {
            recommendations: ranked.map((s) => ({
                cropName: s.cropName,
                confidence: round4(s.avgPrice / maxPrice),
                notes: `Avg market price ${round2(s.avgPrice)} across ${s.listings} active listing(s).`,
            })),
            modelInfo: { engine: "local-heuristic", method: "price-rank" },
        };
    }
}
exports.CropRecommendationService = CropRecommendationService;
exports.cropRecommendationService = new CropRecommendationService();
//# sourceMappingURL=cropRecommendationService.js.map