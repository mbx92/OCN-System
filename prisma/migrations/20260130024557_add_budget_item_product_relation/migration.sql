-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "category" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "saveAsProduct" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
