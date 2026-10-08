import { env } from "../../config/env";
import { prisma } from "../../prisma/client";
import { aiHttpClient } from "./aiHttpClient";

export type DemandForecastingInput = {
  productId?: string;
  state?: string;
  region?: string;
  horizonDays?: number;
  features?: Record<string, unknown>;
};

export type DemandForecastingOutput = {
  forecast?: number[];
  units?: string;
  dates?: string[];
  modelInfo?: Record<string, unknown>;
  raw?: unknown;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export class DemandForecastingService {
  async forecast(
    input: DemandForecastingInput
  ): Promise<DemandForecastingOutput> {
    if (env.AI_SERVICE_URL) {
      try {
        return await aiHttpClient.request<DemandForecastingOutput>({
          method: "POST",
          path: "/demand-forecasting",
          body: input,
        });
      } catch {
        // fall through to local heuristic
      }
    }
    return this.forecastLocal(input);
  }

  // Seasonal-naive forecast: daily average shipped quantity over the trailing
  // window, modulated by a mild weekly seasonality curve.
  private async forecastLocal(
    input: DemandForecastingInput
  ): Promise<DemandForecastingOutput> {
    const horizonDays = Math.min(
      Math.max(Math.floor(input.horizonDays ?? 14), 1),
      90
    );
    const windowDays = 90;
    const since = new Date(Date.now() - windowDays * DAY_MS);

    const agg = await prisma.shipmentItem.aggregate({
      _sum: { quantity: true },
      _count: true,
      where: {
        ...(input.productId ? { productId: input.productId } : {}),
        createdAt: { gte: since },
      },
    });

    const totalQty =
      agg._sum.quantity !== null ? Number(agg._sum.quantity) : 0;
    const samples = agg._count;
    const dailyAvg = totalQty / windowDays;

    const forecast: number[] = [];
    const dates: string[] = [];
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

export const demandForecastingService = new DemandForecastingService();
