"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
const orderRepository_1 = require("../repositories/orderRepository");
const buyerRepository_1 = require("../repositories/buyerRepository");
const farmerRepository_1 = require("../repositories/farmerRepository");
exports.orderService = {
    async placeOrder(userId, payload) {
        const buyerProfile = await buyerRepository_1.buyerRepository.requireProfileByUserId(userId);
        return orderRepository_1.orderRepository.createOrderWithShipmentsTx({
            buyerProfileId: buyerProfile.id,
            currency: payload.currency,
            notes: payload.notes,
            destinationName: payload.destinationName,
            destinationAddress: payload.destinationAddress,
            destinationPhone: payload.destinationPhone,
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
    },
    async acceptOrder(userId, orderId) {
        // Farmer profile resolution + existence
        const farmerProfile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        return orderRepository_1.orderRepository.acceptOrderTx({
            farmerProfileId: farmerProfile.id,
            orderId,
        });
    },
    async rejectOrder(userId, orderId) {
        const farmerProfile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        return orderRepository_1.orderRepository.rejectOrderTx({
            farmerProfileId: farmerProfile.id,
            orderId,
        });
    },
};
//# sourceMappingURL=orderService.js.map