-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('AIR', 'FLIGHT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'AIR';
