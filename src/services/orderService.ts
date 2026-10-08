import { orderRepository } from "../repositories/orderRepository";
import { buyerRepository } from "../repositories/buyerRepository";
import { farmerRepository } from "../repositories/farmerRepository";
import { notificationService, type NotifyInput } from "./notificationService";
import type { PlaceOrderInput } from "../validators/orderValidator";

// Maps a shipment advance status to the buyer-facing notification type.
const SHIPMENT_NOTIFICATION: Record<"PACKED" | "SHIPPED" | "DELIVERED", NotifyInput["type"]> = {
  PACKED: "ORDER_PACKED",
  SHIPPED: "ORDER_SHIPPED",
  DELIVERED: "ORDER_DELIVERED",
};

export const orderService = {
  async placeOrder(userId: string, payload: PlaceOrderInput) {
    const buyerProfile = await buyerRepository.requireProfileByUserId(userId);

    const result = await orderRepository.createOrderWithShipmentsTx({
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
    await notificationService.emit(
      result.farmerUserIds.map((farmerUserId) => ({
        userId: farmerUserId,
        type: "ORDER_PLACED" as const,
        ctx: { orderId: result.orderId },
      }))
    );

    return result;
  },

  async acceptOrder(userId: string, orderId: string) {
    // Farmer profile resolution + existence
    const farmerProfile = await farmerRepository.requireProfileByUserId(userId);

    const result = await orderRepository.acceptOrderTx({
      farmerProfileId: farmerProfile.id,
      orderId,
    });

    if (result.buyerUserId) {
      await notificationService.emit({
        userId: result.buyerUserId,
        type: "ORDER_ACCEPTED",
        ctx: { orderId },
      });
    }

    return result;
  },

  async rejectOrder(userId: string, orderId: string) {
    const farmerProfile = await farmerRepository.requireProfileByUserId(userId);

    const result = await orderRepository.rejectOrderTx({
      farmerProfileId: farmerProfile.id,
      orderId,
    });

    if (result.buyerUserId) {
      await notificationService.emit({
        userId: result.buyerUserId,
        type: "ORDER_REJECTED",
        ctx: { orderId },
      });
    }

    return result;
  },

  async advanceShipmentStatus(
    userId: string,
    orderId: string,
    status: "PACKED" | "SHIPPED" | "DELIVERED"
  ) {
    const farmerProfile = await farmerRepository.requireProfileByUserId(userId);

    const result = await orderRepository.advanceShipmentStatusTx({
      farmerProfileId: farmerProfile.id,
      orderId,
      status,
    });

    if (result.buyerUserId) {
      await notificationService.emit({
        userId: result.buyerUserId,
        type: SHIPMENT_NOTIFICATION[status],
        ctx: { orderId },
      });
    }

    return result;
  },

  // Buyer confirms receipt → releases farmer escrow into available balance.
  async confirmReceived(userId: string, orderId: string) {
    const buyerProfile = await buyerRepository.requireProfileByUserId(userId);

    const result = await orderRepository.confirmReceiptTx({
      buyerProfileId: buyerProfile.id,
      orderId,
    });

    if (!result.alreadyConfirmed && result.released.length) {
      const notifications: NotifyInput[] = [];
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
      await notificationService.emit(notifications);
    }

    return result;
  },
};
