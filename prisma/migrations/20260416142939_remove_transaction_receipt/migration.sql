/*
  Warnings:

  - You are about to drop the column `transaction_id` on the `Receipt` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_transaction_id_fkey";

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "transaction_id",
ADD COLUMN     "transactionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
