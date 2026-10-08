import { prisma } from "../prisma/client";

export type MarketPriceCreateParams = {
  productId: string;
  recordedAt: Date;
  price: number | string;
  currency?: string;
  source?: "USER_REPORTED" | "FEED" | "MANUAL_ENTRY" | "EXTERNAL_PROVIDER";
  region?: string | null;
  quality?: string | null;
  notes?: string | null;
};

export type MarketPriceUpdateParams = {
  productId?: string;
  recordedAt?: Date;
  price?: number | string;
  currency?: string;
  source?: "USER_REPORTED" | "FEED" | "MANUAL_ENTRY" | "EXTERNAL_PROVIDER";
  region?: string | null;
  quality?: string | null;
  notes?: string | null;
};

export const marketPriceRepository = {
  async addMarketPrice(params: MarketPriceCreateParams) {
    return prisma.marketPrice.create({
      data: {
        productId: params.productId,
        recordedAt: params.recordedAt,
        price: params.price as any,
        currency: params.currency ?? undefined,
        source: (params.source ?? "MANUAL_ENTRY") as any,
        region: params.region ?? null,
        quality: params.quality ?? null,
        notes: params.notes ?? null,
      },
    });
  },

  async updateMarketPrice(id: string, params: MarketPriceUpdateParams) {
    return prisma.marketPrice.update({
      where: { id },
      data: {
        ...(params.productId !== undefined ? { productId: params.productId } : {}),
        ...(params.recordedAt !== undefined ? { recordedAt: params.recordedAt } : {}),
        ...(params.price !== undefined ? { price: params.price as any } : {}),
        ...(params.currency !== undefined ? { currency: params.currency } : {}),
        ...(params.source !== undefined ? { source: params.source as any } : {}),
        ...(params.region !== undefined ? { region: params.region } : {}),
        ...(params.quality !== undefined ? { quality: params.quality } : {}),
        ...(params.notes !== undefined ? { notes: params.notes } : {}),
      },
    });
  },

  async getCurrentPriceByProduct(productId: string, region?: string) {
    return prisma.marketPrice.findFirst({
      where: {
        productId,
        ...(region ? { region } : {}),
      },
      orderBy: { recordedAt: "desc" },
      select: {
        price: true,
        currency: true,
        recordedAt: true,
        region: true,
        id: true,
      },
    });
  },
};

