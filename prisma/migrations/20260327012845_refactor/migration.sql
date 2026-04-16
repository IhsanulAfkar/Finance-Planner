/*
  Warnings:

  - You are about to drop the column `name` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `task_id` on the `ChatExecutionHistory` table. All the data in the column will be lost.
  - You are about to drop the column `task_lists` on the `ChatExecutionHistory` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTarget` on the `SavingsGoal` table. All the data in the column will be lost.
  - You are about to drop the column `savedAmount` on the `SavingsGoal` table. All the data in the column will be lost.
  - You are about to drop the column `targetAmount` on the `SavingsGoal` table. All the data in the column will be lost.
  - You are about to drop the column `targetDate` on the `SavingsGoal` table. All the data in the column will be lost.
  - You are about to drop the column `receipt_id` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_id` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_id` to the `SavingsContribution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_amount` to the `SavingsGoal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('ONE_TIME', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_user_id_fkey";

-- DropForeignKey
ALTER TABLE "SavingsContribution" DROP CONSTRAINT "SavingsContribution_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receipt_id_fkey";

-- DropIndex
DROP INDEX "Transaction_receipt_id_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ChatExecutionHistory" DROP COLUMN "task_id",
DROP COLUMN "task_lists";

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "transaction_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SavingsContribution" ADD COLUMN     "transaction_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SavingsGoal" DROP COLUMN "monthlyTarget",
DROP COLUMN "savedAmount",
DROP COLUMN "targetAmount",
DROP COLUMN "targetDate",
ADD COLUMN     "monthly_target" DOUBLE PRECISION,
ADD COLUMN     "target_amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "target_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "receipt_id",
ADD COLUMN     "frequency" "FrequencyType" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "source" TEXT;

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "type" "TransactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatExecutionHistoryItem" (
    "id" SERIAL NOT NULL,
    "execution_id" INTEGER NOT NULL,
    "transaction_id" INTEGER,
    "savings_contribution_id" INTEGER,
    "account_id" INTEGER,

    CONSTRAINT "ChatExecutionHistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_user_id_name_type_key" ON "TransactionCategory"("user_id", "name", "type");

-- CreateIndex
CREATE INDEX "SavingsContribution_goal_id_idx" ON "SavingsContribution"("goal_id");

-- CreateIndex
CREATE INDEX "SavingsContribution_transaction_id_idx" ON "SavingsContribution"("transaction_id");

-- CreateIndex
CREATE INDEX "Transaction_user_id_idx" ON "Transaction"("user_id");

-- CreateIndex
CREATE INDEX "Transaction_account_id_idx" ON "Transaction"("account_id");

-- CreateIndex
CREATE INDEX "Transaction_category_id_idx" ON "Transaction"("category_id");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- AddForeignKey
ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatExecutionHistoryItem" ADD CONSTRAINT "ChatExecutionHistoryItem_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ChatExecutionHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatExecutionHistoryItem" ADD CONSTRAINT "ChatExecutionHistoryItem_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatExecutionHistoryItem" ADD CONSTRAINT "ChatExecutionHistoryItem_savings_contribution_id_fkey" FOREIGN KEY ("savings_contribution_id") REFERENCES "SavingsContribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatExecutionHistoryItem" ADD CONSTRAINT "ChatExecutionHistoryItem_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
