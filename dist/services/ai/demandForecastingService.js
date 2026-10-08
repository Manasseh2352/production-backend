"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandForecastingService = exports.DemandForecastingService = void 0;
const aiHttpClient_1 = require("./aiHttpClient");
class DemandForecastingService {
    async forecast(input) {
        return aiHttpClient_1.aiHttpClient.request({
            method: "POST",
            path: "/demand-forecasting",
            body: input,
        });
    }
}
exports.DemandForecastingService = DemandForecastingService;
exports.demandForecastingService = new DemandForecastingService();
//# sourceMappingURL=demandForecastingService.js.map