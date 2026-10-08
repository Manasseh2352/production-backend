"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandForecastingService = exports.DemandForecastingService = void 0;
const env_1 = require("../../config/env");
const client_1 = require("../../prisma/client");
const aiHttpClient_1 = require("./aiHttpClient");
const round2 = (n) => Math.round(n * 100) / 100;
const DAY_MS = 24 * 60 * 60 * 1000;
class DemandForecastingService {
    async forecast(input) {
        if (env_1.env.AI_SERVICE_URL) {
            try {
                return await aiHttpClient_1.aiHttpClient.request({
                    method: "POST",
                    path: "/demand-forecasting",
                    body: input,
                });
            }
            catch {
                // fall through to local heuristic
            }
        }
        return this.forecastLocal(input);
    }
    // Seasonal-naive forecast: daily average shipped quantity over the trailing
    // window, modulated by a mild weekly seasonality curve.
    async forecastLocal(input) {
        const horizonDays = Math.min(Math.max(Math.floor(input.horizonDays ?? 14), 1), 90);
        const windowDays = 90;
        const since = new Date(Date.now() - windowDays * DAY_MS);
        const agg = await client_1.prisma.shipmentItem.aggregate({
            _sum: { quantity: true },
            _count: true,
            where: {
                ...(input.productId ? { productId: input.productId } : {}),
                createdAt: { gte: since },
            },
        });
        const totalQty = agg._sum.quantity !== null ? Number(agg._sum.quantity) : 0;
        const samples = agg._count;
        const dailyAvg = totalQty / windowDays;
        const forecast = [];
        const dates = [];
        const start = new Date();
        for (let i = 0; i < horizonDays; i++) {
            const seasonal = 1 + 0.1 * Math.sin((2 * Math.PI * i) / 7);
            forecast.push(round2(Math.max(0, dailyAvg * seasonal)));
            const d = new Date(start.getTime() + i * DAY_MS);
            dates.push(d.toISOString().slice(0, 10));
        }
        return {
            forecast,
            units: "kg",
            dates,
            modelInfo: {
                engine: "local-heuristic",
                method: "seasonal-naive",
                windowDays,
                dailyAverage: round2(dailyAvg),
                samples,
            },
        };
    }
}
exports.DemandForecastingService = DemandForecastingService;
exports.demandForecastingService = new DemandForecastingService();
//# sourceMappingURL=demandForecastingService.js.map