import { marketPriceRepository } from "../repositories/marketPriceRepository";

export const marketPriceService = {
  async addMarketPrice(input: {
    productId: string;
    recordedAt: Date;
    price: number;
    currency?: string;
    source?: "USER_REPORTED" | "FEED" | "MANUAL_ENTRY" | "EXTERNAL_PROVIDER";
    region?: string | null;
    quality?: string | null;
    notes?: string | null;
  }) {
    return marketPriceRepository.addMarketPrice({
      ...input,
      region: input.region ?? null,
      quality: input.quality ?? null,
      notes: input.notes ?? null,
    });
  },

  async updateMarketPrice(id: string, input: {
    productId?: string;
    recordedAt?: Date;
    price?: number;
    currency?: string;
    source?: "USER_REPORTED" | "FEED" | "MANUAL_ENTRY" | "EXTERNAL_PROVIDER";
    region?: string | null;
    quality?: string | null;
    notes?: string | null;
  }) {
    return marketPriceRepository.updateMarketPrice(id, {
      ...input,
      region: input.region,
      quality: input.quality,
      notes: input.notes,
    });
  },

  async getCurrentPrice(input: { productId: string; region?: string }) {
    return marketPriceRepository.getCurrentPriceByProduct(input.productId, input.region);
  },
};

