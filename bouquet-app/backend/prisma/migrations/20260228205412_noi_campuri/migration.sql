/*
  Warnings:

  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Changed the type of `type` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `imageUrl` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FLOWER', 'WRAPPING', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('PINK', 'RED', 'WHITE', 'YELLOW', 'PURPLE', 'BROWN', 'CLEAR', 'GOLD', 'SILVER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "color" "Color",
DROP COLUMN "type",
ADD COLUMN     "type" "ProductType" NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "imageUrl" SET NOT NULL;
