"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceRepository = void 0;
const client_1 = require("../prisma/client");
exports.marketPriceRepository = {
    async addMarketPrice(params) {
        return client_1.prisma.marketPrice.create({
            data: {
                productId: params.productId,
                recordedAt: params.recordedAt,
                price: params.price,
                currency: params.currency ?? undefined,
                source: (params.source ?? "MANUAL_ENTRY"),
                region: params.region ?? null,
                quality: params.quality ?? null,
                notes: params.notes ?? null,
            },
        });
    },
    async updateMarketPrice(id, params) {
        return client_1.prisma.marketPrice.update({
            where: { id },
            data: {
                ...(params.productId !== undefined ? { productId: params.productId } : {}),
                ...(params.recordedAt !== undefined ? { recordedAt: params.recordedAt } : {}),
                ...(params.price !== undefined ? { price: params.price } : {}),
                ...(params.currency !== undefined ? { currency: params.currency } : {}),
                ...(params.source !== undefined ? { source: params.source } : {}),
                ...(params.region !== undefined ? { region: params.region } : {}),
                ...(params.quality !== undefined ? { quality: params.quality } : {}),
                ...(params.notes !== undefined ? { notes: params.notes } : {}),
            },
        });
    },
    async getCurrentPriceByProduct(productId, region) {
        return client_1.prisma.marketPrice.findFirst({
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
//# sourceMappingURL=marketPriceRepository.js.map