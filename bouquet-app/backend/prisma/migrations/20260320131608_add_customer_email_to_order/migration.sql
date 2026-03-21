-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT;

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
