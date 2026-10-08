"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const client_1 = require("../prisma/client");
exports.userRepository = {
    async findByEmail(email) {
        return client_1.prisma.user.findUnique({ where: { email } });
    },
    async requireByEmail(email) {
        const user = await this.findByEmail(email);
        if (!user)
            throw new Error("User not found");
        return user;
    },
    async create(params) {
        return client_1.prisma.user.create({
            data: {
                email: params.email,
                phone: params.phone,
                passwordHash: params.passwordHash,
                status: params.status,
            },
        });
    },
    async updateStatusById(params) {
        return client_1.prisma.user.update({
            where: { id: params.userId },
            data: { status: params.status },
        });
    },
};
//# sourceMappingURL=userRepository.js.map