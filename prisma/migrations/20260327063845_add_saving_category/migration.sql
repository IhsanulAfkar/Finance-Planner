/*
  Warnings:

  - Added the required column `category_id` to the `SavingsGoal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SavingsGoal" ADD COLUMN     "category_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "SavingsCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SavingsCategory" ADD CONSTRAINT "SavingsCategory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "SavingsCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
