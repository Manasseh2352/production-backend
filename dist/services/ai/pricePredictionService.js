"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricePredictionService = exports.PricePredictionService = void 0;
const aiHttpClient_1 = require("./aiHttpClient");
class PricePredictionService {
    async predict(input) {
        return aiHttpClient_1.aiHttpClient.request({
            method: "POST",
            path: "/price-prediction",
            body: input,
        });
    }
}
exports.PricePredictionService = PricePredictionService;
exports.pricePredictionService = new PricePredictionService();
//# sourceMappingURL=pricePredictionService.js.map