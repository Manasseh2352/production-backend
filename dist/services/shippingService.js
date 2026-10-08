"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingService = void 0;
exports.shippingService = {
    async allocateShippingForShipmentGroupTx(params) {
        // Load shipment group + items (with farmer IDs) and shipping cost
        const shipmentGroup = await params.tx.shipmentGroup.findUnique({
            where: { id: params.shipmentGroupId },
            select: { id: true, shippingCostAmount: true, shippingCurrency: true },
        });
        if (!shipmentGroup) {
            const err = new Error("ShipmentGroup not found");
            err.status = 404;
            throw err;
        }
        // Use persisted shippingCostAmount (source of truth) but allow fallback.
        const totalShippingCost = Number(shipmentGroup.shippingCostAmount ?? params.shippingAmount ?? 0);
        const shippingCurrency = shipmentGroup.shippingCurrency ?? params.currency;
        const items = await params.tx.shipmentItem.findMany({
            where: { shipmentGroupId: params.shipmentGroupId },
            select: {
                quantity: true,
                product: {
                    select: {
                        farmerProfileId: true,
                    },
                },
            },
        });
        const totalWeightKg = items.reduce((acc, it) => acc + Number(it.quantity), 0);
        if (totalWeightKg <= 0) {
            const err = new Error("ShipmentGroup has zero total weight; cannot allocate shipping");
            err.status = 400;
            throw err;
        }
        // Aggregate by farmer
        const weightByFarmer = new Map();
        for (const it of items) {
            const farmerProfileId = it.product.farmerProfileId;
            const w = Number(it.quantity);
            weightByFarmer.set(farmerProfileId, (weightByFarmer.get(farmerProfileId) ?? 0) + w);
        }
        // Upsert allocations + create per-farmer shipping invoices
        const allocations = [];
        for (const [farmerProfileId, farmerWeightKg] of weightByFarmer.entries()) {
            const shippingPercentage = farmerWeightKg / totalWeightKg;
            const shippingAmountAllocated = totalShippingCost * shippingPercentage;
            const allocation = await params.tx.shipmentShippingAllocation.upsert({
                where: {
                    shipmentGroupId_farmerProfileId: {
                        shipmentGroupId: params.shipmentGroupId,
                        farmerProfileId,
                    },
                },
                update: {
                    weightContributionKg: farmerWeightKg,
                    shippingPercentage,
                    shippingAmount: shippingAmountAllocated,
                },
                create: {
                    shipmentGroupId: params.shipmentGroupId,
                    farmerProfileId,
                    weightContributionKg: farmerWeightKg,
                    shippingPercentage,
                    shippingAmount: shippingAmountAllocated,
                },
            });
            allocations.push(allocation);
            // Create a SHIPPING invoice per farmer.
            // We reuse Invoice table by encoding invoice kind in payload.
            await params.tx.invoice.create({
                data: {
                    orderId: params.orderId,
                    status: "DRAFT",
                    currency: shippingCurrency,
                    subtotalAmount: 0,
                    taxAmount: 0,
                    shippingAmount: shippingAmountAllocated,
                    totalAmount: shippingAmountAllocated,
                    payload: {
                        invoiceType: "SHIPPING",
                        shipmentGroupId: params.shipmentGroupId,
                        farmerProfileId,
                        shippingCurrency,
                        shippingPercentage,
                        shippingAmount: shippingAmountAllocated,
                        // Keep a reference to allocations for transparency
                        allocations: allocations,
                    },
                },
            });
        }
        return {
            shipmentGroupId: params.shipmentGroupId,
            totalWeightKg,
            totalShippingCost,
            allocations,
        };
    },
};
//# sourceMappingURL=shippingService.js.map