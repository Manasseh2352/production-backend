import { env } from "../../config/env";
import { prisma } from "../../prisma/client";
import { aiHttpClient } from "./aiHttpClient";

export type ProfitEstimationInput = {
  productId?: string;
  state?: string;
  region?: string;
  expectedSellPrice?: number;
  expectedCost?: number;
  expectedRevenue?: number;
  currency?: string;
  // Optional structured context for the AI
  features?: Record<string, unknown>;
};

export type ProfitEstimationOutput = {
  estimatedProfit?: number;
  currency?: string;
  profitMargin?: number;
  modelInfo?: Record<string, unknown>;
  raw?: unknown;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

// Assumed cost-to-revenue ratio when the caller does not supply a cost.
const ASSUMED_COST_RATIO = 0.65;

export class ProfitEstimationService {
  async estimate(input: ProfitEstimationInput): Promise<ProfitEstimationOutput> {
    if (env.AI_SERVICE_URL) {
      try {
        return await aiHttpClient.request<ProfitEstimationOutput>({
          method: "POST",
          path: "/profit-estimation",
          body: input,
        });
      } catch {
        // fall through to local heuristic
      }
    }
    return this.estimateLocal(input);
  }

  private async estimateLocal(
    input: ProfitEstimationInput
  ): Promise<ProfitEstimationOutput> {
    const currency = input.currency ?? "USD";

    let revenue = input.expectedRevenue ?? 0;
    let quantityKg: number | null = null;

    // Derive revenue from the product listing when not explicitly provided.
    if (!revenue && input.productId) {
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: { pricePerKg: true, quantityKg: true },
      });
      if (product) {
        const unitPrice = input.expectedSellPrice ?? Number(product.pricePerKg);
        quantityKg = Number(product.quantityKg);
        revenue = unitPrice * quantityKg;
      }
    }

    if (!revenue && input.expectedSellPrice) {
      revenue = input.expectedSellPrice;
    }

    let cost = input.expectedCost ?? null;
    let costAssumed = false;
    if (cost === null) {
      cost = revenue * ASSUMED_COST_RATIO;
      costAssumed = true;
    }

    const profit = revenue - cost;
    const margin = revenue > 0 ? profit / revenue : 0;

    return {
      estimatedProfit: round2(profit),
      currency,
      profitMargin: round4(margin),
      modelInfo: {
        engine: "local-heuristic",
        method: "revenue-minus-cost",
        revenue: round2(revenue),
        cost: round2(cost),
        costAssumed,
        ...(quantityKg !== null ? { quantityKg } : {}),
      },
    };
  }
}

export const profitEstimationService = new ProfitEstimationService();
