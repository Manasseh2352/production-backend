"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = void 0;
const client_1 = require("../prisma/client");
exports.orderRepository = {
    async requireBuyerProfileByUserId(userId) {
        const profile = await client_1.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!profile) {
            const err = new Error("Buyer profile not found");
            err.status = 404;
            throw err;
        }
        return profile;
    },
    async requireFarmerProfileByUserId(userId) {
        const profile = await client_1.prisma.farmerProfile.findUnique({ where: { userId } });
        if (!profile) {
            const err = new Error("Farmer profile not found");
            err.status = 404;
            throw err;
        }
        return profile;
    },
    async createOrderWithShipmentsTx(params) {
        // Compute subtotal by items unless overridden
        const computedSubtotal = params.items.reduce((acc, it) => acc + it.quantityKg * it.unitPrice, 0);
        const subtotal = params.pricing?.subtotalAmount ?? computedSubtotal;
        const tax = params.pricing?.taxAmount ?? 0;
        const shipping = params.pricing?.shippingAmount ?? 0;
        const total = params.pricing?.totalAmount ?? subtotal + tax + shipping;
        // Pre-validate products exist
        const productIds = params.items.map((i) => i.productId);
        const existing = await client_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true },
        });
        const existingSet = new Set(existing.map((p) => p.id));
        const missing = productIds.filter((id) => !existingSet.has(id));
        if (missing.length) {
            const err = new Error("One or more products not found");
            err.status = 400;
            throw err;
        }
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    buyerProfileId: params.buyerProfileId,
                    currency: params.currency,
                    notes: params.notes ?? null,
                    subtotalAmount: subtotal,
                    taxAmount: tax,
                    shippingAmount: shipping,
                    totalAmount: total,
                    status: "PENDING",
                },
            });
            const shipmentGroup = await tx.shipmentGroup.create({
                data: {
                    orderId: order.id,
                    status: "PENDING",
                    destinationName: params.destinationName ?? null,
                    destinationAddress: params.destinationAddress ?? null,
                    destinationPhone: params.destinationPhone ?? null,
                    shippingCostAmount: shipping,
                    shippingCurrency: params.currency ?? "NGN",
                    // Capacity tracking fields are populated during farmer-upload consolidation.
                    // For order-created shipment groups, keep them at 0.
                    currentWeightKg: 0,
                    maximumWeightKg: 0,
                    remainingWeightKg: 0,
                    departureDate: new Date(),
                },
            });
            await tx.shipmentItem.createMany({
                data: params.items.map((it) => {
                    const lineTotal = it.quantityKg * it.unitPrice;
                    return {
                        shipmentGroupId: shipmentGroup.id,
                        productId: it.productId,
                        quantity: it.quantityKg,
                        unit: "kg",
                        currency: params.currency,
                        unitPrice: it.unitPrice,
                        lineTotal,
                        status: "PENDING",
                    };
                }),
            });
            const payload = {
                currency: params.currency,
                items: params.items.map((it) => ({
                    productId: it.productId,
                    quantityKg: it.quantityKg,
                    unitPrice: it.unitPrice,
                    lineTotal: it.quantityKg * it.unitPrice,
                })),
                subtotalAmount: subtotal,
                taxAmount: tax,
                shippingAmount: shipping,
                totalAmount: total,
                notes: params.notes ?? null,
                destination: {
                    destinationName: params.destinationName ?? null,
                    destinationAddress: params.destinationAddress ?? null,
                    destinationPhone: params.destinationPhone ?? null,
                },
            };
            const invoice = await tx.invoice.create({
                data: {
                    orderId: order.id,
                    status: "DRAFT",
                    currency: params.currency,
                    subtotalAmount: subtotal,
                    taxAmount: tax,
                    shippingAmount: shipping,
                    totalAmount: total,
                    payload,
                },
            });
            // Allocate shipping cost by Weight Contribution and generate per-farmer shipping invoices
            // NOTE: This uses Product.farmerProfileId to determine farmer ownership of each shipment item.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { shippingService } = require("../services/shippingService");
            await shippingService.allocateShippingForShipmentGroupTx({
                tx,
                shipmentGroupId: shipmentGroup.id,
                orderId: order.id,
                currency: params.currency,
                shippingAmount: shipping,
            });
            return {
                orderId: order.id,
                order,
                shipmentGroup,
                invoice,
            };
        });
    },
    async acceptOrderTx(params) {
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: params.orderId },
                include: {
                    shipmentGroups: {
                        include: {
                            items: true,
                        },
                    },
                },
            });
            if (!order) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }
            if (order.status !== "PENDING") {
                const err = new Error("Order cannot be accepted from current state");
                err.status = 409;
                throw err;
            }
            const farmerItemsCount = await tx.shipmentItem.count({
                where: {
                    shipmentGroup: { orderId: params.orderId },
                    product: { farmerProfileId: params.farmerProfileId },
                },
            });
            const totalItemsCount = await tx.shipmentItem.count({
                where: {
                    shipmentGroup: { orderId: params.orderId },
                },
            });
            if (totalItemsCount === 0 || farmerItemsCount !== totalItemsCount) {
                const err = new Error("Farmer cannot accept this order");
                err.status = 403;
                throw err;
            }
            const updatedOrder = await tx.order.update({
                where: { id: params.orderId },
                data: { status: "ACCEPTED" },
            });
            await tx.shipmentGroup.updateMany({
                where: { orderId: params.orderId },
                data: { status: "PROCESSING" },
            });
            await tx.shipmentItem.updateMany({
                where: { shipmentGroup: { orderId: params.orderId } },
                data: { status: "PROCESSING" },
            });
            const invoice = await tx.invoice.findFirst({
                where: { orderId: params.orderId },
            });
            if (!invoice) {
                const err = new Error("Invoice not found for order");
                err.status = 500;
                throw err;
            }
            const issuedInvoice = await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: "ISSUED",
                    issuedAt: new Date(),
                },
            });
            return { order: updatedOrder, invoice: issuedInvoice };
        });
    },
    async rejectOrderTx(params) {
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({ where: { id: params.orderId } });
            if (!order) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }
            if (order.status !== "PENDING") {
                const err = new Error("Order cannot be rejected from current state");
                err.status = 409;
                throw err;
            }
            const farmerItemsCount = await tx.shipmentItem.count({
                where: {
                    shipmentGroup: { orderId: params.orderId },
                    product: { farmerProfileId: params.farmerProfileId },
                },
            });
            if (farmerItemsCount === 0) {
                const err = new Error("Farmer cannot reject this order");
                err.status = 403;
                throw err;
            }
            await tx.order.update({
                where: { id: params.orderId },
                data: { status: "CANCELLED" },
            });
            await tx.shipmentGroup.updateMany({
                where: { orderId: params.orderId },
                data: { status: "CANCELLED" },
            });
            await tx.shipmentItem.updateMany({
                where: { shipmentGroup: { orderId: params.orderId } },
                data: { status: "CANCELLED" },
            });
            await tx.invoice.updateMany({
                where: { orderId: params.orderId },
                data: { status: "CANCELLED" },
            });
            return { ok: true };
        });
    },
    async getBuyerOrderForResponse(params) {
        const order = await client_1.prisma.order.findFirst({
            where: {
                buyerProfileId: params.buyerProfileId,
                id: params.orderId,
            },
            include: {
                payments: true,
                shipmentGroups: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        farmerProfile: true,
                                    },
                                },
                            },
                        },
                    },
                },
                // Invoice relation is available as `invoices` only if Prisma schema has it included.
                // Current Prisma-generated types for Order may not expose this include, so omit it.
            },
        });
        if (!order) {
            const err = new Error("Order not found");
            err.status = 404;
            throw err;
        }
        return order;
    },
};
//# sourceMappingURL=orderRepository.js.map