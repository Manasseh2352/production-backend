"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingRecommendationService = exports.ShippingRecommendationService = void 0;
const aiHttpClient_1 = require("./aiHttpClient");
class ShippingRecommendationService {
    async recommend(input) {
        return aiHttpClient_1.aiHttpClient.request({
            method: "POST",
            path: "/shipping-recommendation",
            body: input,
        });
    }
}
exports.ShippingRecommendationService = ShippingRecommendationService;
exports.shippingRecommendationService = new ShippingRecommendationService();
//# sourceMappingURL=shippingRecommendationService.js.map