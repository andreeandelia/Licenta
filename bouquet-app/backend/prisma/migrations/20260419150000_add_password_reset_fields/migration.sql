-- AlterTable
ALTER TABLE "User"
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_resetPasswordToken_idx" ON "User"("resetPasswordToken");
