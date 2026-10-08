import { prisma } from "../prisma/client";
import type { ProductTypeName } from "../constants/productTypes";

export const productRepository = {
  async createProduct(params: {
    farmerProfileId: string;
    productName: ProductTypeName;
    quantityKg: number;
    quantityTonnes?: number;
    unitPrice: number;
    totalValue: number;
    state?: string | null;
    description?: string | null;
    location?: string | null;
    destinationCountry?: string | null;
    images?: string[];
  }) {
    // Prisma Product model uses:
    // - quantityKg: Decimal(18,3)
    // - quantityTonnes: Decimal(18,6)
    // - pricePerKg: Decimal(18,2)
    // - totalValue: Decimal(18,2)
    return prisma.product.create({
      data: {
        farmerProfileId: params.farmerProfileId,
        productName: params.productName,
        quantityKg: params.quantityKg as any,
        quantityTonnes:
          params.quantityTonnes !== undefined
            ? (params.quantityTonnes as any)
            : ((params.quantityKg / 1000) as any),
        pricePerKg: params.unitPrice as any,
        totalValue: params.totalValue as any,
        description: params.description ?? null,
        location: params.location ?? null,
        destinationCountry: params.destinationCountry ?? null,
        images: params.images ?? [],
        // Published immediately so buyers can browse & order right away.
        status: "ACTIVE",
      },
    });
  },

  // Buyer-facing catalog: only ACTIVE products, newest first, with the
  // owning farmer profile so the client can show the seller.
  async listActiveProducts(params: {
    q?: string;
    productName?: ProductTypeName;
    limit?: number;
    offset?: number;
  }) {
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 50;
    const offset = params.offset && params.offset >= 0 ? params.offset : 0;

    const where: any = { status: "ACTIVE" };
    if (params.productName) where.productName = params.productName;
    if (params.q && params.q.trim()) {
      const q = params.q.trim();
      where.OR = [
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { destinationCountry: { contains: q, mode: "insensitive" } },
      ];
    }

    return prisma.product.findMany({
      where,
      include: { farmerProfile: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  async getActiveProductById(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, status: "ACTIVE" },
      include: { farmerProfile: true },
    });
  },

  async listByFarmerProfileId(farmerProfileId: string) {
    return prisma.product.findMany({
      where: { farmerProfileId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Pricing reference used when a farmer uploads without an explicit price:
  // fall back to the most recent ACTIVE product of the same type from ANY farmer.
  async findLatestPriceByType(productName: ProductTypeName) {
    const latest = await prisma.product.findFirst({
      where: { productName, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { pricePerKg: true },
    });
    return latest?.pricePerKg ?? null;
  },
};
