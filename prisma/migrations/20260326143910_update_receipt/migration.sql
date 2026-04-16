/*
  Warnings:

  - A unique constraint covering the columns `[receipt_id]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receipt_id_key" ON "Transaction"("receipt_id");
