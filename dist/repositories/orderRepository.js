"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = void 0;
const client_1 = require("../prisma/client");
const dhlService_1 = require("../services/dhlService");
const walletRepository_1 = require("./walletRepository");
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
            select: { id: true, farmerProfile: { select: { userId: true } } },
        });
        const existingSet = new Set(existing.map((p) => p.id));
        const missing = productIds.filter((id) => !existingSet.has(id));
        if (missing.length) {
            const err = new Error("One or more products not found");
            err.status = 400;
            throw err;
        }
        // Distinct farmer user IDs owning products in this order (for notifications).
        const farmerUserIds = Array.from(new Set(existing
            .map((p) => p.farmerProfile?.userId)
            .filter((id) => Boolean(id))));
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    buyerProfileId: params.buyerProfileId,
                    currency: params.currency,
                    notes: params.notes ?? null,
                    deliveryMethod: params.deliveryMethod ?? "AIR",
                    subtotalAmount: subtotal,
                    taxAmount: tax,
                    shippingAmount: shipping,
                    totalAmount: total,
                    status: "CREATED",
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
                    carrier: "DHL",
                    trackingNumber: dhlService_1.dhlService.generateTrackingNumber(),
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
                farmerUserIds,
            };
        }, { maxWait: 10000, timeout: 20000 });
    },
    async acceptOrderTx(params) {
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: params.orderId },
                include: {
                    buyerProfile: { select: { userId: true } },
                    shipmentGroups: {
                        include: {
                            items: {
                                include: { product: { select: { farmerProfileId: true } } },
                            },
                        },
                    },
                },
            });
            if (!order) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }
            if (order.status !== "CREATED") {
                const err = new Error("Order cannot be accepted from current state");
                err.status = 409;
                throw err;
            }
            // Compute item ownership from the already-fetched items instead of
            // issuing extra count queries. Fewer round-trips keeps this interactive
            // transaction comfortably under its timeout on a remote (Neon) database.
            const allItems = order.shipmentGroups.flatMap((g) => g.items);
            const totalItemsCount = allItems.length;
            const farmerItemsCount = allItems.filter((it) => it.product?.farmerProfileId === params.farmerProfileId).length;
            if (totalItemsCount === 0 || farmerItemsCount !== totalItemsCount) {
                const err = new Error("Farmer cannot accept this order");
                err.status = 403;
                throw err;
            }
            const updatedOrder = await tx.order.update({
                where: { id: params.orderId },
                data: { status: "CONFIRMED" },
            });
            const shipmentGroupRows = await tx.shipmentGroup.findMany({
                where: { orderId: params.orderId },
                select: { id: true, trackingNumber: true, carrier: true, status: true },
            });
            for (const shipmentGroupRow of shipmentGroupRows) {
                await tx.shipmentGroup.update({
                    where: { id: shipmentGroupRow.id },
                    data: {
                        status: "PACKED",
                        carrier: shipmentGroupRow.carrier ?? "DHL",
                        trackingNumber: shipmentGroupRow.trackingNumber ?? dhlService_1.dhlService.generateTrackingNumber(),
                        shippedAt: shipmentGroupRow.shippedAt ?? null,
                    },
                });
            }
            await tx.shipmentItem.updateMany({
                where: { shipmentGroup: { orderId: params.orderId } },
                data: { status: "RESERVED" },
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
            return { order: updatedOrder, invoice: issuedInvoice, buyerUserId: order.buyerProfile?.userId };
        }, { maxWait: 10000, timeout: 20000 });
    },
    async advanceShipmentStatusTx(params) {
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: params.orderId },
                include: {
                    buyerProfile: { select: { userId: true } },
                    shipmentGroups: {
                        include: {
                            items: {
                                include: { product: { select: { farmerProfileId: true } } },
                            },
                        },
                    },
                },
            });
            if (!order) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }
            const allItems = order.shipmentGroups.flatMap((g) => g.items ?? []);
            const farmerItemsCount = allItems.filter((it) => it.product?.farmerProfileId === params.farmerProfileId).length;
            if (allItems.length === 0 || farmerItemsCount !== allItems.length) {
                const err = new Error("Farmer cannot update this shipment status");
                err.status = 403;
                throw err;
            }
            const shipmentStatusOrder = ["PENDING", "PACKED", "SHIPPED", "DELIVERED"];
            const currentShipmentStatus = order.shipmentGroups.find((g) => g.status === "DELIVERED")?.status ??
                order.shipmentGroups.find((g) => g.status === "SHIPPED")?.status ??
                order.shipmentGroups.find((g) => g.status === "PACKED")?.status ??
                "PENDING";
            const currentIndex = shipmentStatusOrder.indexOf(currentShipmentStatus);
            const targetIndex = shipmentStatusOrder.indexOf(params.status);
            if (currentIndex === -1 || targetIndex === -1 || targetIndex < currentIndex) {
                const err = new Error("Shipment status cannot be advanced in that order");
                err.status = 409;
                throw err;
            }
            const orderStatusByShipmentStatus = {
                PACKED: "CONFIRMED",
                SHIPPED: "SHIPPED",
                DELIVERED: "DELIVERED",
            };
            await tx.order.update({
                where: { id: params.orderId },
                data: {
                    status: orderStatusByShipmentStatus[params.status] ?? order.status,
                },
            });
            await tx.shipmentGroup.updateMany({
                where: { orderId: params.orderId },
                data: {
                    status: params.status,
                    shippedAt: params.status === "SHIPPED" ? new Date() : undefined,
                    deliveredAt: params.status === "DELIVERED" ? new Date() : undefined,
                },
            });
            await tx.shipmentItem.updateMany({
                where: { shipmentGroup: { orderId: params.orderId } },
                data: {
                    status: params.status === "DELIVERED" ? "DELIVERED" : params.status === "SHIPPED" ? "SHIPPED" : "RESERVED",
                    shippedAt: params.status === "SHIPPED" ? new Date() : undefined,
                    deliveredAt: params.status === "DELIVERED" ? new Date() : undefined,
                },
            });
            return { ok: true, status: params.status, buyerUserId: order.buyerProfile?.userId };
        }, { maxWait: 10000, timeout: 20000 });
    },
    async rejectOrderTx(params) {
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: params.orderId },
                include: { buyerProfile: { select: { userId: true } } },
            });
            if (!order) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }
            if (order.status !== "CREATED") {
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
            // If the buyer had already paid, reverse the escrow hold(s) for this order.
            const reversals = await walletRepository_1.walletRepository.reverseEscrowForOrder(tx, {
                orderId: params.orderId,
            });
            return { ok: true, buyerUserId: order.buyerProfile?.userId, reversals };
        }, { maxWait: 10000, timeout: 20000 });
    },
    // Buyer confirms they received the goods. Requires the order to be DELIVERED,
    // then releases the farmer(s) escrow into available balance. Idempotent via
    // Order.receiptConfirmedAt.
    async confirmReceiptTx(params) {
        return client_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: params.orderId, buyerProfileId: params.buyerProfileId },
                select: { id: true, status: true, receiptConfirmedAt: true },
            });
            if (!order) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }
            // Already confirmed — no-op (don't release twice).
            if (order.receiptConfirmedAt) {
                return { alreadyConfirmed: true, released: [] };
            }
            if (order.status !== "DELIVERED") {
                const err = new Error("Order must be delivered before confirming receipt");
                err.status = 409;
                throw err;
            }
            await tx.order.update({
                where: { id: order.id },
                data: { receiptConfirmedAt: new Date() },
            });
            const released = await walletRepository_1.walletRepository.releaseEscrowForOrder(tx, { orderId: order.id });
            return { alreadyConfirmed: false, released };
        }, { maxWait: 10000, timeout: 20000 });
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