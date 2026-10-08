"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceService = void 0;
const marketPriceRepository_1 = require("../repositories/marketPriceRepository");
exports.marketPriceService = {
    async addMarketPrice(input) {
        return marketPriceRepository_1.marketPriceRepository.addMarketPrice({
            ...input,
            region: input.region ?? null,
            quality: input.quality ?? null,
            notes: input.notes ?? null,
        });
    },
    async updateMarketPrice(id, input) {
        return marketPriceRepository_1.marketPriceRepository.updateMarketPrice(id, {
            ...input,
            region: input.region,
            quality: input.quality,
            notes: input.notes,
        });
    },
    async getCurrentPrice(input) {
        return marketPriceRepository_1.marketPriceRepository.getCurrentPriceByProduct(input.productId, input.region);
    },
};
//# sourceMappingURL=marketPriceService.js.map