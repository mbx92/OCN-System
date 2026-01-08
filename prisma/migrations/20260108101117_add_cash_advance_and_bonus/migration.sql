-- CreateTable
CREATE TABLE "TechnicianCashAdvance" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianCashAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianBonus" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "bonusType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "period" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianBonus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TechnicianCashAdvance" ADD CONSTRAINT "TechnicianCashAdvance_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianBonus" ADD CONSTRAINT "TechnicianBonus_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
