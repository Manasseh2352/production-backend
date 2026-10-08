"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
const orderRepository_1 = require("../repositories/orderRepository");
const buyerRepository_1 = require("../repositories/buyerRepository");
const farmerRepository_1 = require("../repositories/farmerRepository");
const notificationService_1 = require("./notificationService");
// Maps a shipment advance status to the buyer-facing notification type.
const SHIPMENT_NOTIFICATION = {
    PACKED: "ORDER_PACKED",
    SHIPPED: "ORDER_SHIPPED",
    DELIVERED: "ORDER_DELIVERED",
};
exports.orderService = {
    async placeOrder(userId, payload) {
        const buyerProfile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        const result = await orderRepository_1.orderRepository.createOrderWithShipmentsTx({
            buyerProfileId: buyerProfile.id,
            currency: payload.currency,
            notes: payload.notes,
            destinationName: payload.destinationName,
            destinationAddress: payload.destinationAddress,
            destinationPhone: payload.destinationPhone,
            deliveryMethod: payload.deliveryMethod,
            items: payload.items.map((it) => ({
                productId: it.productId,
                quantityKg: it.quantityKg,
                unitPrice: it.unitPrice,
            })),
            pricing: {
                subtotalAmount: payload.subtotalAmount,
                taxAmount: payload.taxAmount,
                shippingAmount: payload.shippingAmount,
                totalAmount: payload.totalAmount,
            },
        });
        // Notify every farmer that has goods in this order.
        await notificationService_1.notificationService.emit(result.farmerUserIds.map((farmerUserId) => ({
            userId: farmerUserId,
            type: "ORDER_PLACED",
            ctx: { orderId: result.orderId },
        })));
        return result;
    },
    async acceptOrder(userId, orderId) {
        // Farmer profile resolution + existence
        const farmerProfile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        const result = await orderRepository_1.orderRepository.acceptOrderTx({
            farmerProfileId: farmerProfile.id,
            orderId,
        });
        if (result.buyerUserId) {
            await notificationService_1.notificationService.emit({
                userId: result.buyerUserId,
                type: "ORDER_ACCEPTED",
                ctx: { orderId },
            });
        }
        return result;
    },
    async rejectOrder(userId, orderId) {
        const farmerProfile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        const result = await orderRepository_1.orderRepository.rejectOrderTx({
            farmerProfileId: farmerProfile.id,
            orderId,
        });
        if (result.buyerUserId) {
            await notificationService_1.notificationService.emit({
                userId: result.buyerUserId,
                type: "ORDER_REJECTED",
                ctx: { orderId },
            });
        }
        return result;
    },
    async advanceShipmentStatus(userId, orderId, status) {
        const farmerProfile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        const result = await orderRepository_1.orderRepository.advanceShipmentStatusTx({
            farmerProfileId: farmerProfile.id,
            orderId,
            status,
        });
        if (result.buyerUserId) {
            await notificationService_1.notificationService.emit({
                userId: result.buyerUserId,
                type: SHIPMENT_NOTIFICATION[status],
                ctx: { orderId },
            });
        }
        return result;
    },
    // Buyer confirms receipt → releases farmer escrow into available balance.
    async confirmReceived(userId, orderId) {
        const buyerProfile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        const result = await orderRepository_1.orderRepository.confirmReceiptTx({
            buyerProfileId: buyerProfile.id,
            orderId,
        });
        if (!result.alreadyConfirmed && result.released.length) {
            const notifications = [];
            for (const movement of result.released) {
                notifications.push({
                    userId: movement.userId,
                    type: "RECEIPT_CONFIRMED",
                    ctx: { orderId },
                });
                notifications.push({
                    userId: movement.userId,
                    type: "ESCROW_RELEASED",
                    ctx: { orderId, amount: movement.amount, currency: movement.currency },
                });
            }
            await notificationService_1.notificationService.emit(notifications);
        }
        return result;
    },
};
//# sourceMappingURL=orderService.js.map