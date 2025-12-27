/*
  Warnings:

  - You are about to drop the column `businessCashPercentage` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "unit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "businessCashPercentage";
