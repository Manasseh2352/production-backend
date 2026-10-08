"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitEstimationService = exports.ProfitEstimationService = void 0;
const aiHttpClient_1 = require("./aiHttpClient");
class ProfitEstimationService {
    async estimate(input) {
        return aiHttpClient_1.aiHttpClient.request({
            method: "POST",
            path: "/profit-estimation",
            body: input,
        });
    }
}
exports.ProfitEstimationService = ProfitEstimationService;
exports.profitEstimationService = new ProfitEstimationService();
//# sourceMappingURL=profitEstimationService.js.map