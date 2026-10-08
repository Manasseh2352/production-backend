"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const productRepository_1 = require("../repositories/productRepository");
const marketPriceService_1 = require("./marketPriceService");
const client_1 = require("../prisma/client");
const productTypes_1 = require("../constants/productTypes");
const dhlService_1 = require("./dhlService");
exports.productService = {
    async createFromFarmerUpload(params) {
        // Resolve a unit price without ever hard-failing the upload. Precedence:
        //   1. Explicit unitPriceOverride from the farmer.
        //   2. Latest market price for any product of this type (farmer's own first,
        //      then any farmer's).
        //   3. Latest ACTIVE product price of this type across all farmers.
        //   4. A per-type reference default (last resort).
        let unitPrice = null;
        if (params.unitPriceOverride !== undefined) {
            unitPrice = params.unitPriceOverride;
        }
        else {
            // Prefer a market price tied to any existing product of this type,
            // starting with this farmer's, then falling back to any farmer's.
            const priceReferenceProduct = (await client_1.prisma.product.findFirst({
                where: { farmerProfileId: params.farmerProfileId, productName: params.productName },
                select: { id: true },
                orderBy: { createdAt: "desc" },
            })) ??
                (await client_1.prisma.product.findFirst({
                    where: { productName: params.productName },
                    select: { id: true },
                    orderBy: { createdAt: "desc" },
                }));
            if (priceReferenceProduct) {
                const current = await marketPriceService_1.marketPriceService.getCurrentPrice({
                    productId: priceReferenceProduct.id,
                    region: params.state,
                });
                if (current)
                    unitPrice = Number(current.price);
            }
            // Fall back to the latest published product price of this type.
            if (unitPrice === null) {
                const latestByType = await productRepository_1.productRepository.findLatestPriceByType(params.productName);
                if (latestByType !== null)
                    unitPrice = Number(latestByType);
            }
            // Last resort: a per-type reference default so uploads never fail.
            if (unitPrice === null) {
                unitPrice = productTypes_1.DEFAULT_PRICE_PER_KG[params.productName];
                // eslint-disable-next-line no-console
                console.warn(`[productService] no market/history price for ${params.productName}; using default ${unitPrice}/kg`);
            }
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
            images: params.images,
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
                    carrier: "DHL",
                    trackingNumber: dhlService_1.dhlService.generateTrackingNumber(),
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
        }, { maxWait: 10000, timeout: 20000 });
    },
};
//# sourceMappingURL=productService.js.map