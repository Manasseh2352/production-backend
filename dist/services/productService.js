"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const productRepository_1 = require("../repositories/productRepository");
const marketPriceService_1 = require("./marketPriceService");
const client_1 = require("../prisma/client");
exports.productService = {
    async createFromFarmerUpload(params) {
        // Find latest market price for this *product type*.
        // In your current schema, MarketPrice ties to Product row (productId), not productName.
        // Since a new Product row doesn't exist yet, we map by creating a temporary product row is NOT desired.
        // Instead, we interpret requirement as: market price table is maintained per product type.
        // To support that with current schema, we need MarketPrice to reference a product type.
        // For now, we use a pragmatic approach: require client to provide a `productId` for pricing.
        // But your task says Product field; schema already has productId.
        // Therefore we will throw a helpful error if override not provided and no productId is given.
        // This service expects `unitPriceOverride` OR `pricePerKg` comes from an explicit productId in request.
        // Since current validators don't include productId, we instead look for a MarketPrice with the latest recordedAt
        // for ANY productId matching the uploaded productName by scanning existing products of that type.
        let unitPrice = null;
        if (params.unitPriceOverride !== undefined) {
            unitPrice = params.unitPriceOverride;
        }
        else {
            // Find any existing product for this farmer profile + productName, then use its latest market price.
            const anyProduct = await client_1.prisma.product.findFirst({
                where: { farmerProfileId: params.farmerProfileId, productName: params.productName },
                select: { id: true },
                orderBy: { createdAt: "desc" },
            });
            if (!anyProduct) {
                throw Object.assign(new Error("No existing product found for pricing. Provide unitPriceOverride in request."), { status: 400 });
            }
            const current = await marketPriceService_1.marketPriceService.getCurrentPrice({ productId: anyProduct.id, region: params.state });
            if (!current) {
                throw Object.assign(new Error("No market price available for this product/state."), { status: 400 });
            }
            unitPrice = Number(current.price);
        }
        const totalValue = params.quantityKg * unitPrice;
        const createdProduct = await productRepository_1.productRepository.createProduct({
            farmerProfileId: params.farmerProfileId,
            productName: params.productName,
            quantityKg: params.quantityKg,
            unitPrice,
            totalValue,
            state: params.state ?? null,
            description: params.description,
            location: params.location,
            destinationCountry: params.destinationCountry,
        });
        // Shipment Consolidation (LCL): allocate this product into a ShipmentGroup by destination country + remaining capacity.
        // Implemented only when destinationCountry is provided.
        if (!params.destinationCountry)
            return createdProduct;
        // NOTE: Prisma types are currently out of sync with schema changes (destinationCountry/weights/ids).
        // Use `any` for tx.shipmentGroup/shipmentItem queries until Prisma client is regenerated after migration.
        return client_1.prisma.$transaction(async (tx) => {
            const quantityKg = params.quantityKg;
            const destinationCountry = params.destinationCountry;
            const capacityKg = 5000;
            const last14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            const orderCountLast14d = await tx.order.count({
                where: { createdAt: { gte: last14d } },
            });
            const candidate = await tx.shipmentGroup.findFirst({
                where: {
                    destinationCountry,
                    remainingWeightKg: { gte: quantityKg },
                    status: { in: ["PENDING", "PACKED"] },
                },
                orderBy: { departureDate: "asc" },
                select: {
                    id: true,
                    currentWeightKg: true,
                    remainingWeightKg: true,
                },
            });
            if (candidate) {
                const newCurrentWeightKg = Number(candidate.currentWeightKg) + quantityKg;
                const newRemainingWeightKg = Number(candidate.remainingWeightKg) - quantityKg;
                await tx.shipmentGroup.update({
                    where: { id: candidate.id },
                    data: {
                        currentWeightKg: newCurrentWeightKg,
                        remainingWeightKg: newRemainingWeightKg,
                    },
                });
                await tx.shipmentItem.create({
                    data: {
                        shipmentGroupId: candidate.id,
                        productId: createdProduct.id,
                        quantity: quantityKg,
                        unit: "kg",
                        currency: "USD",
                        unitPrice: unitPrice,
                        lineTotal: totalValue,
                        status: "PENDING",
                    },
                });
                return createdProduct;
            }
            const thresholdMet = orderCountLast14d >= 1 && quantityKg >= 3500;
            const departureDate = thresholdMet
                ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const newCurrentWeightKg = quantityKg;
            const newRemainingWeightKg = capacityKg - quantityKg;
            const shipmentGroup = await tx.shipmentGroup.create({
                data: {
                    // nullable orderId
                    orderId: null,
                    status: "PENDING",
                    destinationCountry,
                    maximumWeightKg: capacityKg,
                    currentWeightKg: newCurrentWeightKg,
                    remainingWeightKg: newRemainingWeightKg,
                    departureDate,
                },
            });
            await tx.shipmentItem.create({
                data: {
                    shipmentGroupId: shipmentGroup.id,
                    productId: createdProduct.id,
                    quantity: quantityKg,
                    unit: "kg",
                    currency: "USD",
                    unitPrice: unitPrice,
                    lineTotal: totalValue,
                    status: "PENDING",
                },
            });
            return createdProduct;
        });
    },
};
//# sourceMappingURL=productService.js.map