import { withAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const DELETE = withAuth<{ id: string }>(async (req, auth, { params }) => {
  try {
    const id = Number(params?.id)

    if (!id) {
      return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });
    }

    // 1. Find transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        user_id: auth.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    // 2. Run DB transaction
    await prisma.$transaction(async (tx) => {
      // Reverse balance
      const balanceAdjustment =
        transaction.type === "INCOME"
          ? -transaction.amount
          : transaction.amount;

      await tx.account.update({
        where: { id: transaction.account_id },
        data: {
          balance: { increment: balanceAdjustment },
        },
      });

      // Delete savings contributions (if any)
      await tx.savingsContribution.deleteMany({
        where: { transaction_id: transaction.id },
      });

      // Delete receipt items first (if you use them)
      await tx.receiptItem.deleteMany({
        where: {
          receipt: {
            transaction_id: transaction.id,
          },
        },
      });

      // Delete receipt
      await tx.receipt.deleteMany({
        where: { transaction_id: transaction.id },
      });

      // Finally delete transaction
      await tx.transaction.delete({
        where: { id: transaction.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE API Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});