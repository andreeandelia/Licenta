/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,bouquetId]` on the table `CartItems` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CartItems" ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "CartItems_sessionId_idx" ON "CartItems"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItems_sessionId_bouquetId_key" ON "CartItems"("sessionId", "bouquetId");
