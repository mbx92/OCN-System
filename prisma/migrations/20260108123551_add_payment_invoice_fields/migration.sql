-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
