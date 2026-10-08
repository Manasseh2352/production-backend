"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRepository = void 0;
const client_1 = require("../prisma/client");
// NOTE: Prisma generated delegate name for model `OTP` is `oTP` due to casing.
exports.otpRepository = {
    async findActiveByUserAndPurpose(params) {
        return client_1.prisma.oTP.findFirst({
            where: {
                userId: params.userId,
                purpose: params.purpose,
                status: "ACTIVE",
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async deleteActiveByUserAndPurpose(params) {
        await client_1.prisma.oTP.deleteMany({
            where: {
                userId: params.userId,
                purpose: params.purpose,
            },
        });
    },
    async create(params) {
        return client_1.prisma.oTP.create({
            data: {
                userId: params.userId,
                purpose: params.purpose,
                channel: params.channel,
                tokenHash: params.tokenHash,
                expiresAt: params.expiresAt,
            },
        });
    },
    async findValidByUserPurposeToken(params) {
        return client_1.prisma.oTP.findFirst({
            where: {
                userId: params.userId,
                purpose: params.purpose,
                tokenHash: params.tokenHash,
                status: "ACTIVE",
                expiresAt: { gt: new Date() },
            },
        });
    },
    async consumeAndDelete(params) {
        await client_1.prisma.oTP.delete({ where: { id: params.otpId } });
    },
};
//# sourceMappingURL=otpRepository.js.map