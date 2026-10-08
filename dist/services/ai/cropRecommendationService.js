"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropRecommendationService = exports.CropRecommendationService = void 0;
const aiHttpClient_1 = require("./aiHttpClient");
class CropRecommendationService {
    async recommend(input) {
        return aiHttpClient_1.aiHttpClient.request({
            method: "POST",
            path: "/crop-recommendation",
            body: input,
        });
    }
}
exports.CropRecommendationService = CropRecommendationService;
exports.cropRecommendationService = new CropRecommendationService();
//# sourceMappingURL=cropRecommendationService.js.map