import { prisma } from "../prisma/client";

// NOTE: Prisma generated delegate name for model `OTP` is `oTP` due to casing.
export const otpRepository = {
  async findActiveByUserAndPurpose(params: { userId: string; purpose: string }) {
    return prisma.oTP.findFirst({
      where: {
        userId: params.userId,
        purpose: params.purpose as any,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async deleteActiveByUserAndPurpose(params: { userId: string; purpose: string }) {
    await prisma.oTP.deleteMany({
      where: {
        userId: params.userId,
        purpose: params.purpose as any,
      },
    });
  },

  async create(params: {
    userId: string;
    purpose: string;
    channel: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.oTP.create({
      data: {
        userId: params.userId,
        purpose: params.purpose as any,
        channel: params.channel as any,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
      },
    });
  },

  async findValidByUserPurposeToken(params: {
    userId: string;
    purpose: string;
    tokenHash: string;
  }) {
    return prisma.oTP.findFirst({
      where: {
        userId: params.userId,
        purpose: params.purpose as any,
        tokenHash: params.tokenHash,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });
  },

  async consumeAndDelete(params: { otpId: string }) {
    await prisma.oTP.delete({ where: { id: params.otpId } });
  },
};

