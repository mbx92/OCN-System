-- CreateEnum
CREATE TYPE "TaxPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'EXEMPTED');

-- CreateTable
CREATE TABLE "TaxPayment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "omzet" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.005,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "TaxPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "billingCode" TEXT,
    "paymentProof" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "cashTransactionId" TEXT,

    CONSTRAINT "TaxPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxPayment_cashTransactionId_key" ON "TaxPayment"("cashTransactionId");

-- CreateIndex
CREATE INDEX "TaxPayment_status_dueDate_idx" ON "TaxPayment"("status", "dueDate");

-- CreateIndex
CREATE INDEX "TaxPayment_year_month_idx" ON "TaxPayment"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "TaxPayment_year_month_key" ON "TaxPayment"("year", "month");

-- AddForeignKey
ALTER TABLE "TaxPayment" ADD CONSTRAINT "TaxPayment_cashTransactionId_fkey" FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
