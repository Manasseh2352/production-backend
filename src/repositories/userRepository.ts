import { prisma } from "../prisma/client";

type UserRole = "FARMER" | "BUYER" | "ADMIN";

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByIdWithProfiles(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { buyerProfile: true, farmerProfile: true },
    });
  },

  async requireByEmail(email: string) {
    const user = await this.findByEmail(email);
    if (!user) throw new Error("User not found");
    return user;
  },

  async create(params: {
    email: string;
    phone?: string;
    passwordHash: string;
    role?: UserRole;
    status?: string;
  }) {
    return prisma.user.create({
      data: {
        email: params.email,
        phone: params.phone,
        passwordHash: params.passwordHash,
        role: (params.role ?? "BUYER") as any,
        status: (params.status ?? "ACTIVE") as any,
      },
    });
  },

  async updateStatusById(params: { userId: string; status: string }) {
    return prisma.user.update({
      where: { id: params.userId },
      data: { status: params.status as any },
    });
  },
};
