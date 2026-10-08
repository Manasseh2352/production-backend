import { env } from "../../config/env";
import { prisma } from "../../prisma/client";
import { aiHttpClient } from "./aiHttpClient";

export type PricePredictionInput = {
  productId?: string;
  state?: string;
  region?: string;
  currency?: string;
  // Allow arbitrary feature payload from controller later
  features?: Record<string, unknown>;
};

export type PricePredictionOutput = {
  predictedPrice?: number;
  currency?: string;
  horizon?: string;
  modelInfo?: Record<string, unknown>;
  raw?: unknown;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Fallback price used when there is no listing/market data at all.
const DEFAULT_PRICE_PER_KG = 600;

export class PricePredictionService {
  async predict(input: PricePredictionInput): Promise<PricePredictionOutput> {
    // Prefer the external ML microservice when configured; otherwise (or if it
    // fails) fall back to a local heuristic computed from our own data so the
    // feature always returns a usable answer for the demo.
    if (env.AI_SERVICE_URL) {
      try {
        return await aiHttpClient.request<PricePredictionOutput>({
          method: "POST",
          path: "/price-prediction",
          body: input,
        });
      } catch {
        // fall through to local heuristic
      }
    }
    return this.predictLocal(input);
  }

  private async predictLocal(
    input: PricePredictionInput
  ): Promise<PricePredictionOutput> {
    const currency = input.currency ?? "USD";
    let method = "market-average";
    let samples = 0;
    let predicted: number | null = null;

    if (input.productId) {
      const history = await prisma.marketPrice.findMany({
        where: { productId: input.productId },
        orderBy: { recordedAt: "asc" },
        take: 60,
        select: { price: true },
      });
      samples = history.length;

      if (history.length >= 2) {
        const prices = history.map((h) => Number(h.price));
        // Average of the most recent step changes → simple linear trend.
        const steps: number[] = [];
        for (let i = 1; i < prices.length; i++) {
          steps.push(prices[i] - prices[i - 1]);
        }
        const recentSteps = steps.slice(-6);
        const avgStep =
          recentSteps.reduce((a, b) => a + b, 0) / recentSteps.length;
        predicted = prices[prices.length - 1] + avgStep;
        method = "linear-trend";
      } else if (history.length === 1) {
        predicted = Number(history[0].price);
        method = "last-known";
      }

      if (predicted === null) {
        const product = await prisma.product.findUnique({
          where: { id: input.productId },
          select: { pricePerKg: true },
        });
        if (product) {
          predicted = Number(product.pricePerKg);
          method = "current-listing";
        }
      }
    }

    if (predicted === null) {
      const agg = await prisma.product.aggregate({
        _avg: { pricePerKg: true },
        where: { status: "ACTIVE" },
      });
      if (agg._avg.pricePerKg !== null) {
        predicted = Number(agg._avg.pricePerKg);
        method = "market-average";
      }
    }

    if (predicted === null || !Number.isFinite(predicted) || predicted <= 0) {
      predicted = DEFAULT_PRICE_PER_KG;
      method = "default";
    }

    return {
      predictedPrice: round2(predicted),
      currency,
      horizon: "next-cycle",
      modelInfo: { engine: "local-heuristic", method, samples },
    };
  }
}

export const pricePredictionService = new PricePredictionService();
