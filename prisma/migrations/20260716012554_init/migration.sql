-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('FARMER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ProfileStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD_OUT', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('CREATED', 'CONFIRMED', 'CANCELLED', 'FULFILLING', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'WALLET');

-- CreateEnum
CREATE TYPE "public"."ShipmentGroupStatus" AS ENUM ('PENDING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ShipmentItemStatus" AS ENUM ('PENDING', 'RESERVED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OTPPurpose" AS ENUM ('LOGIN', 'SIGNUP', 'PASSWORD_RESET', 'PHONE_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."OTPChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "public"."OTPStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."MarketPriceSource" AS ENUM ('USER_REPORTED', 'FEED', 'MANUAL_ENTRY', 'EXTERNAL_PROVIDER');

-- CreateEnum
CREATE TYPE "public"."PredictionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('CROP', 'LIVESTOCK', 'GRAIN', 'FRUIT', 'VEGETABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RestrictedProductType" AS ENUM ('YAM', 'TOMATO', 'POTATO');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'BUYER',
    "status" "public"."ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "public"."ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "farmName" TEXT,
    "location" TEXT,
    "profileImageUrl" TEXT,
    "profileImagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuyerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "public"."ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WishlistItem" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedProduct" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "farmerProfileId" TEXT NOT NULL,
    "productName" "public"."RestrictedProductType" NOT NULL,
    "sku" TEXT,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "quantityKg" DECIMAL(18,3) NOT NULL,
    "quantityTonnes" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "pricePerKg" DECIMAL(18,2) NOT NULL,
    "totalValue" DECIMAL(18,2) NOT NULL,
    "images" TEXT[],
    "description" TEXT,
    "location" TEXT,
    "destinationCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'CREATED',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentGroup" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "status" "public"."ShipmentGroupStatus" NOT NULL DEFAULT 'PENDING',
    "destinationCountry" TEXT,
    "shippingCostAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "shippingCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "currentWeightKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "maximumWeightKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "remainingWeightKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "departureDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinationName" TEXT,
    "destinationAddress" TEXT,
    "destinationPhone" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentShippingAllocation" (
    "id" TEXT NOT NULL,
    "shipmentGroupId" TEXT NOT NULL,
    "farmerProfileId" TEXT NOT NULL,
    "weightContributionKg" DECIMAL(18,3) NOT NULL,
    "shippingPercentage" DECIMAL(18,10) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentShippingAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentGroupId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "status" "public"."ShipmentItemStatus" NOT NULL DEFAULT 'PENDING',
    "reservedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "public"."PaymentMethod" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(18,2) NOT NULL,
    "provider" TEXT,
    "providerPaymentId" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" "public"."MarketPriceSource" NOT NULL DEFAULT 'MANUAL_ENTRY',
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "price" DECIMAL(18,2) NOT NULL,
    "region" TEXT,
    "quality" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Prediction" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "public"."PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "predictedPrice" DECIMAL(18,2) NOT NULL,
    "modelName" TEXT,
    "version" TEXT,
    "confidence" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OTP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "public"."OTPPurpose" NOT NULL,
    "channel" "public"."OTPChannel" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "public"."OTPStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_userId_key" ON "public"."FarmerProfile"("userId");

-- CreateIndex
CREATE INDEX "FarmerProfile_status_idx" ON "public"."FarmerProfile"("status");

-- CreateIndex
CREATE INDEX "FarmerProfile_location_idx" ON "public"."FarmerProfile"("location");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "public"."BuyerProfile"("userId");

-- CreateIndex
CREATE INDEX "BuyerProfile_status_idx" ON "public"."BuyerProfile"("status");

-- CreateIndex
CREATE INDEX "WishlistItem_buyerProfileId_idx" ON "public"."WishlistItem"("buyerProfileId");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "public"."WishlistItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_buyerProfileId_productId_key" ON "public"."WishlistItem"("buyerProfileId", "productId");

-- CreateIndex
CREATE INDEX "SavedProduct_buyerProfileId_idx" ON "public"."SavedProduct"("buyerProfileId");

-- CreateIndex
CREATE INDEX "SavedProduct_productId_idx" ON "public"."SavedProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProduct_buyerProfileId_productId_key" ON "public"."SavedProduct"("buyerProfileId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_farmerProfileId_idx" ON "public"."Product"("farmerProfileId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "public"."Product"("status");

-- CreateIndex
CREATE INDEX "Product_productName_idx" ON "public"."Product"("productName");

-- CreateIndex
CREATE INDEX "Order_buyerProfileId_idx" ON "public"."Order"("buyerProfileId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentGroup_trackingNumber_key" ON "public"."ShipmentGroup"("trackingNumber");

-- CreateIndex
CREATE INDEX "ShipmentGroup_orderId_idx" ON "public"."ShipmentGroup"("orderId");

-- CreateIndex
CREATE INDEX "ShipmentGroup_status_idx" ON "public"."ShipmentGroup"("status");

-- CreateIndex
CREATE INDEX "ShipmentShippingAllocation_shipmentGroupId_idx" ON "public"."ShipmentShippingAllocation"("shipmentGroupId");

-- CreateIndex
CREATE INDEX "ShipmentShippingAllocation_farmerProfileId_idx" ON "public"."ShipmentShippingAllocation"("farmerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentShippingAllocation_shipmentGroupId_farmerProfileId_key" ON "public"."ShipmentShippingAllocation"("shipmentGroupId", "farmerProfileId");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentGroupId_idx" ON "public"."ShipmentItem"("shipmentGroupId");

-- CreateIndex
CREATE INDEX "ShipmentItem_productId_idx" ON "public"."ShipmentItem"("productId");

-- CreateIndex
CREATE INDEX "ShipmentItem_status_idx" ON "public"."ShipmentItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "public"."Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "public"."Payment"("method");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "public"."Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "MarketPrice_productId_recordedAt_idx" ON "public"."MarketPrice"("productId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketPrice_source_idx" ON "public"."MarketPrice"("source");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_productId_recordedAt_key" ON "public"."MarketPrice"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "Prediction_productId_targetDate_idx" ON "public"."Prediction"("productId", "targetDate" DESC);

-- CreateIndex
CREATE INDEX "Prediction_status_idx" ON "public"."Prediction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_productId_targetDate_key" ON "public"."Prediction"("productId", "targetDate");

-- CreateIndex
CREATE UNIQUE INDEX "OTP_tokenHash_key" ON "public"."OTP"("tokenHash");

-- CreateIndex
CREATE INDEX "OTP_userId_idx" ON "public"."OTP"("userId");

-- CreateIndex
CREATE INDEX "OTP_purpose_idx" ON "public"."OTP"("purpose");

-- CreateIndex
CREATE INDEX "OTP_channel_idx" ON "public"."OTP"("channel");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "public"."OTP"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "public"."RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_revokedAt_idx" ON "public"."RefreshToken"("revokedAt");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "public"."RefreshToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."FarmerProfile" ADD CONSTRAINT "FarmerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "public"."BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProduct" ADD CONSTRAINT "SavedProduct_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "public"."BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProduct" ADD CONSTRAINT "SavedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "public"."FarmerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "public"."BuyerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentGroup" ADD CONSTRAINT "ShipmentGroup_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentShippingAllocation" ADD CONSTRAINT "ShipmentShippingAllocation_shipmentGroupId_fkey" FOREIGN KEY ("shipmentGroupId") REFERENCES "public"."ShipmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentShippingAllocation" ADD CONSTRAINT "ShipmentShippingAllocation_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "public"."FarmerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentGroupId_fkey" FOREIGN KEY ("shipmentGroupId") REFERENCES "public"."ShipmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentItem" ADD CONSTRAINT "ShipmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketPrice" ADD CONSTRAINT "MarketPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prediction" ADD CONSTRAINT "Prediction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OTP" ADD CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
