-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingStreet" TEXT,
ADD COLUMN     "billingZipCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingStreet" TEXT,
ADD COLUMN     "billingZipCode" TEXT;
