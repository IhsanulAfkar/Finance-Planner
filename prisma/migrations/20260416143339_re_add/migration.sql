/*
  Warnings:

  - You are about to drop the column `transactionId` on the `Receipt` table. All the data in the column will be lost.
  - Added the required column `transaction_id` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_transactionId_fkey";

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "transactionId",
ADD COLUMN     "transaction_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
