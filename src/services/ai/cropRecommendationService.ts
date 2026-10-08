import { env } from "../../config/env";
import { prisma } from "../../prisma/client";
import { aiHttpClient } from "./aiHttpClient";
import {
  PRODUCT_TYPES,
  DEFAULT_PRICE_PER_KG,
  type ProductTypeName,
} from "../../constants/productTypes";

export type CropRecommendationInput = {
  farmerProfileId?: string;
  state?: string;
  season?: string;
  soilType?: string;
  budget?: number;
  riskProfile?: "LOW" | "MEDIUM" | "HIGH";
  features?: Record<string, unknown>;
};

export type CropRecommendationOutput = {
  recommendations?: Array<{
    cropName?: string;
    confidence?: number;
    notes?: string;
  }>;
  modelInfo?: Record<string, unknown>;
  raw?: unknown;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

// The restricted non-perishable tubers, ranked below by market value.
const CROP_TYPES: ProductTypeName[] = [...PRODUCT_TYPES];

export class CropRecommendationService {
  async recommend(
    input: CropRecommendationInput
  ): Promise<CropRecommendationOutput> {
    if (env.AI_SERVICE_URL) {
      try {
        return await aiHttpClient.request<CropRecommendationOutput>({
          method: "POST",
          path: "/crop-recommendation",
          body: input,
        });
      } catch {
        // fall through to local heuristic
      }
    }
    return this.recommendLocal(input);
  }

  // Rank the restricted tuber crops by average active-listing price, so the
  // recommendation reflects current market value in our own catalog.
  private async recommendLocal(
    _input: CropRecommendationInput
  ): Promise<CropRecommendationOutput> {
    const stats = await Promise.all(
      CROP_TYPES.map(async (t) => {
        const agg = await prisma.product.aggregate({
          _avg: { pricePerKg: true },
          _count: true,
          where: { status: "ACTIVE", productName: t },
        });
        const avgPrice =
          agg._avg.pricePerKg !== null
            ? Number(agg._avg.pricePerKg)
            : DEFAULT_PRICE_PER_KG[t];
        return { cropName: t, avgPrice, listings: agg._count };
      })
    );

    const maxPrice = Math.max(...stats.map((s) => s.avgPrice), 1);
    const ranked = [...stats].sort((a, b) => b.avgPrice - a.avgPrice);

    return {
      recommendations: ranked.map((s) => ({
        cropName: s.cropName,
        confidence: round4(s.avgPrice / maxPrice),
        notes: `Avg market price ${round2(s.avgPrice)} across ${s.listings} active listing(s).`,
      })),
      modelInfo: { engine: "local-heuristic", method: "price-rank" },
    };
  }
}

export const cropRecommendationService = new CropRecommendationService();
