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
                status: "DRAFT",
            },
        });
    },
};
//# sourceMappingURL=productRepository.js.map