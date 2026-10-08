"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = void 0;
const client_1 = require("../prisma/client");
exports.productRepository = {
    async createProduct(params) {
        // Prisma Product model uses:
        // - quantityKg: Decimal(18,3)
        // - quantityTonnes: Decimal(18,6)
        // - pricePerKg: Decimal(18,2)
        // - totalValue: Decimal(18,2)
        return client_1.prisma.product.create({
            data: {
                farmerProfileId: params.farmerProfileId,
                productName: params.productName,
                quantityKg: params.quantityKg,
                quantityTonnes: params.quantityTonnes !== undefined
                    ? params.quantityTonnes
                    : (params.quantityKg / 1000),
                pricePerKg: params.unitPrice,
                totalValue: params.totalValue,
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
    async listActiveProducts(params) {
        const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 50;
        const offset = params.offset && params.offset >= 0 ? params.offset : 0;
        const where = { status: "ACTIVE" };
        if (params.productName)
            where.productName = params.productName;
        if (params.q && params.q.trim()) {
            const q = params.q.trim();
            where.OR = [
                { description: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
                { destinationCountry: { contains: q, mode: "insensitive" } },
            ];
        }
        return client_1.prisma.product.findMany({
            where,
            include: { farmerProfile: true },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    },
    async getActiveProductById(productId) {
        return client_1.prisma.product.findFirst({
            where: { id: productId, status: "ACTIVE" },
            include: { farmerProfile: true },
        });
    },
    async listByFarmerProfileId(farmerProfileId) {
        return client_1.prisma.product.findMany({
            where: { farmerProfileId },
            orderBy: { createdAt: "desc" },
        });
    },
    // Pricing reference used when a farmer uploads without an explicit price:
    // fall back to the most recent ACTIVE product of the same type from ANY farmer.
    async findLatestPriceByType(productName) {
        const latest = await client_1.prisma.product.findFirst({
            where: { productName, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            select: { pricePerKg: true },
        });
        return latest?.pricePerKg ?? null;
    },
};
//# sourceMappingURL=productRepository.js.map