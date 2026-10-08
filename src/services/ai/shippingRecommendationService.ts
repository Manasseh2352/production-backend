import { env } from "../../config/env";
import { prisma } from "../../prisma/client";
import { aiHttpClient } from "./aiHttpClient";

export type ShippingRecommendationInput = {
  orderId?: string;
  destinationCountry?: string;
  weightKg?: number;
  shipmentType?: "LCL" | "FCL" | string;
  features?: Record<string, unknown>;
};

export type ShippingRecommendationOutput = {
  recommendation?: {
    shipmentType?: string;
    recommendedCarrier?: string;
    etaDays?: number;
    costEstimate?: number;
    currency?: string;
    notes?: string;
  };
  modelInfo?: Record<string, unknown>;
  raw?: unknown;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Weight (kg) at/above which a full-container load is recommended.
const FCL_THRESHOLD_KG = 10000;

export class ShippingRecommendationService {
  async recommend(
    input: ShippingRecommendationInput
  ): Promise<ShippingRecommendationOutput> {
    if (env.AI_SERVICE_URL) {
      try {
        return await aiHttpClient.request<ShippingRecommendationOutput>({
          method: "POST",
          path: "/shipping-recommendation",
          body: input,
        });
      } catch {
        // fall through to local heuristic
      }
    }
    return this.recommendLocal(input);
  }

  // Rule-based shipping recommendation. Weight is taken from the input, or
  // estimated from the order's shipped items when only an orderId is given.
  private async recommendLocal(
    input: ShippingRecommendationInput
  ): Promise<ShippingRecommendationOutput> {
    let weightKg = input.weightKg ?? 0;

    if (!weightKg && input.orderId) {
      const groups = await prisma.shipmentGroup.findMany({
        where: { orderId: input.orderId },
        select: { items: { select: { quantity: true, unit: true } } },
      });
      for (const g of groups) {
        for (const it of g.items) {
          if ((it.unit ?? "kg").toLowerCase() === "kg") {
            weightKg += Number(it.quantity);
          }
        }
      }
    }

    const shipmentType =
      input.shipmentType ?? (weightKg >= FCL_THRESHOLD_KG ? "FCL" : "LCL");
    const isFcl = shipmentType === "FCL";
    const costEstimate = isFcl ? 2500 : round2(50 + 0.15 * weightKg);
    const etaDays = isFcl ? 28 : 35;

    return {
      recommendation: {
        shipmentType,
        recommendedCarrier: isFcl
          ? "Ocean FCL Carrier"
          : "Consolidated LCL Freight",
        etaDays,
        costEstimate,
        currency: "USD",
        notes: input.destinationCountry
          ? `Estimate to ${input.destinationCountry} based on ${round2(weightKg)}kg.`
          : `Estimate based on ${round2(weightKg)}kg.`,
      },
      modelInfo: {
        engine: "local-heuristic",
        method: "rule-based",
        weightKg: round2(weightKg),
      },
    };
  }
}

export const shippingRecommendationService = new ShippingRecommendationService();
