/*
  Warnings:

  - The values [TOMATO,POTATO] on the enum `RestrictedProductType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RestrictedProductType_new" AS ENUM ('YAM', 'SWEET_POTATO', 'CASSAVA', 'WATER_YAM');
ALTER TABLE "Product" ALTER COLUMN "productName" TYPE "RestrictedProductType_new" USING ("productName"::text::"RestrictedProductType_new");
ALTER TYPE "RestrictedProductType" RENAME TO "RestrictedProductType_old";
ALTER TYPE "RestrictedProductType_new" RENAME TO "RestrictedProductType";
DROP TYPE "public"."RestrictedProductType_old";
COMMIT;
