/*
  Warnings:

  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryOption` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryState` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryStreet` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryZipCode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DeliveryOption" AS ENUM ('STANDARD', 'SAME_DAY', 'EXPRESS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ADD COLUMN     "deliveryCity" TEXT NOT NULL,
ADD COLUMN     "deliveryDetails" TEXT,
ADD COLUMN     "deliveryOption" "DeliveryOption" NOT NULL,
ADD COLUMN     "deliveryState" TEXT NOT NULL,
ADD COLUMN     "deliveryStreet" TEXT NOT NULL,
ADD COLUMN     "deliveryZipCode" TEXT NOT NULL,
ADD COLUMN     "guestSessionId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "promoCode" TEXT,
ADD COLUMN     "promoDiscountPercent" DOUBLE PRECISION,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "scheduledSlot" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "Order_guestSessionId_idx" ON "Order"("guestSessionId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
