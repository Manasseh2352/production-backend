import { randomUUID } from "crypto";

import { prisma } from "../prisma/client";
import { buyerRepository } from "../repositories/buyerRepository";
import { walletRepository } from "../repositories/walletRepository";
import { notificationService, type NotifyInput } from "./notificationService";

type PaymentMethod = "CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | "WALLET";

// Simulated payment gateway.
//
// This records a real Payment row and marks it PAID immediately, returning a
// provider reference — enough for the full order/invoice flow to work end to
// end in the demo. To integrate a real provider (Paystack/Stripe), replace the
// body of `charge()` with a provider call and initialize the Payment as PENDING
// until the provider webhook confirms it.
//
// On success the buyer's payment is split per farmer (by goods value) and held
// in each farmer's escrow wallet, to be released when the buyer confirms
// receipt. Buyer and farmer(s) are notified.
export const paymentService = {
  async payForOrder(params: {
    userId: string;
    orderId: string;
    method?: PaymentMethod;
  }) {
    const buyerProfile = await buyerRepository.requireProfileByUserId(params.userId);

    const order = await prisma.order.findFirst({
      where: { id: params.orderId, buyerProfileId: buyerProfile.id },
      include: {
        payments: true,
        buyerProfile: { select: { userId: true } },
      },
    });

    if (!order) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    if (order.status === "CANCELLED") {
      throw Object.assign(new Error("Cannot pay for a cancelled order"), { status: 409 });
    }

    // Idempotency: if the order is already paid, return that payment.
    const alreadyPaid = order.payments.find((p: any) => p.status === "PAID");
    if (alreadyPaid) {
      return { payment: alreadyPaid, order, alreadyPaid: true };
    }

    const method: PaymentMethod = params.method ?? "CARD";
    const providerRef = `sim_${randomUUID()}`;
    const now = new Date();

    const { payment, escrowHolds } = await prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          status: "PAID",
          method,
          currency: order.currency,
          amount: order.totalAmount,
          provider: "SIMULATED",
          providerPaymentId: providerRef,
          authorizedAt: now,
          paidAt: now,
        },
      });

      // Mark any issued/draft invoice for this order as PAID.
      await tx.invoice.updateMany({
        where: { orderId: order.id, status: { in: ["DRAFT", "ISSUED"] } },
        data: { status: "PAID" },
      });

      // Split the goods value per farmer and hold each share in escrow.
      const items = await tx.shipmentItem.findMany({
        where: { shipmentGroup: { orderId: order.id } },
        select: {
          lineTotal: true,
          product: {
            select: {
              farmerProfileId: true,
              farmerProfile: { select: { userId: true } },
            },
          },
        },
      });

      const byFarmer = new Map<string, { userId: string; amount: number }>();
      for (const item of items) {
        const farmerProfileId = item.product?.farmerProfileId;
        const farmerUserId = item.product?.farmerProfile?.userId;
        if (!farmerProfileId || !farmerUserId) continue;
        const prev = byFarmer.get(farmerProfileId);
        byFarmer.set(farmerProfileId, {
          userId: farmerUserId,
          amount: (prev?.amount ?? 0) + Number(item.lineTotal),
        });
      }

      const escrowHolds: Array<{ userId: string; amount: number }> = [];
      for (const [farmerProfileId, info] of byFarmer) {
        if (info.amount <= 0) continue;
        await walletRepository.holdEscrow(tx, {
          farmerProfileId,
          orderId: order.id,
          amount: info.amount,
          currency: order.currency,
        });
        escrowHolds.push({ userId: info.userId, amount: info.amount });
      }

      return { payment, escrowHolds };
    }, { maxWait: 10000, timeout: 20000 });

    // Notify buyer (payment sent) and each farmer (payment received / escrowed).
    const notifications: NotifyInput[] = [
      {
        userId: order.buyerProfile.userId,
        type: "PAYMENT_SENT",
        ctx: { orderId: order.id, amount: Number(order.totalAmount), currency: order.currency },
      },
    ];
    for (const hold of escrowHolds) {
      notifications.push({
        userId: hold.userId,
        type: "PAYMENT_RECEIVED",
        ctx: { orderId: order.id, amount: hold.amount, currency: order.currency },
      });
    }
    await notificationService.emit(notifications);

    return { payment, order, alreadyPaid: false };
  },
};
