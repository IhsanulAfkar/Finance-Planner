import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // adjust to your setup
import Joi from "joi"
import { withAuth } from "@/lib/apiAuth"
import { validateImage } from "@/lib/validation/file"
import { Prisma, TransactionType } from "@/generated/prisma/client"
import { TPaginationMeta } from "@/types"
import { saveImage } from "@/lib/storage"
const createTransactionSchema = Joi.object({
  accountId: Joi.number().integer().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string()
    .valid("INCOME", "EXPENSE")
    .required(),
  categoryId: Joi.number().integer().allow(null),
  description: Joi.string().allow("", null),
  source: Joi.string().allow("", null),
  date: Joi.date().optional(),
  receipt: Joi.object({
    merchant: Joi.string().allow("", null),
    total: Joi.number().positive().required(),
    date: Joi.date().optional(),

    items: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          amount: Joi.number().allow(null),
        })
      )
      .optional(),
  }).optional(),
  savingsAllocations: Joi.array()
    .items(
      Joi.object({
        goalId: Joi.number().integer().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .optional(),
})
export const POST = withAuth(async (req, auth) => {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any;
    let receiptImage: File | null = null;

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      receiptImage = formData.get("receipt_image") as File | null;

      body = {
        accountId: Number(formData.get("accountId")),
        amount: Number(formData.get("amount")),
        type: formData.get("type") as any,
        categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
        description: formData.get("description") as string,
        source: formData.get("source") as string,
        date: formData.get("date") as string,
        receipt: formData.get("receipt")
          ? JSON.parse(formData.get("receipt") as string)
          : undefined,
        savingsAllocations: formData.get("savingsAllocations")
          ? JSON.parse(formData.get("savingsAllocations") as string)
          : undefined,
      };
    } else {
      return NextResponse.json({ message: "Unsupported Content-Type" }, { status: 415 });
    }

    const { error, value } = createTransactionSchema.validate(body, { abortEarly: false });
    if (error) {
      return NextResponse.json(
        { message: "Validation error", errors: error.details.map((err) => err.message) },
        { status: 400 }
      );
    }

    let receiptFileUrl: string | null = null
    if (receiptImage) {
      const imageError = validateImage(receiptImage);
      if (imageError) return NextResponse.json({ message: imageError }, { status: 400 });

      receiptFileUrl = await saveImage(receiptImage, auth.user.id)
    }

    const account = await prisma.account.findFirst({
      where: {
        user_id: auth.user.id,
        id: value.accountId
      }
    })
    if (!account) return NextResponse.json({ message: "Account not found" }, { status: 404 })
    const result = await prisma.$transaction(async (tx) => {
      // validate account
      const fromAccount = await tx.account.findFirst({
        where: { id: value.accountId, user_id: auth.user.id },
      });

      if (!fromAccount) throw new Error("Source account not found");

      let toAccount = null;

      if (value.type === "TRANSFER") {
        if (!value.toAccountId) {
          throw new Error("Destination account is required for transfer");
        }

        if (value.toAccountId === value.accountId) {
          throw new Error("Cannot transfer to the same account");
        }

        toAccount = await tx.account.findFirst({
          where: { id: value.toAccountId, user_id: auth.user.id },
        });

        if (!toAccount) throw new Error("Destination account not found");
      }

      // prevent overdraft
      if (["EXPENSE", "TRANSFER"].includes(value.type)) {
        if (fromAccount.balance < value.amount) {
          throw new Error("Insufficient balance");
        }
      }

      // create transaction
      const transaction = await tx.transaction.create({
        data: {
          user_id: auth.user.id,
          account_id: value.accountId,
          to_account_id: value.toAccountId || null,
          amount: value.amount,
          type: value.type,
          category_id: value.categoryId,
          description: value.description,
          date: value.date ? new Date(value.date) : new Date(),
          source: value.source,
        },
      });

      // ===== HANDLE BALANCE =====
      if (value.type === "INCOME") {
        await tx.account.update({
          where: { id: value.accountId },
          data: { balance: { increment: value.amount } },
        });
      }

      if (value.type === "EXPENSE") {
        await tx.account.update({
          where: { id: value.accountId },
          data: { balance: { decrement: value.amount } },
        });
      }

      if (value.type === "TRANSFER") {
        // subtract from source
        await tx.account.update({
          where: { id: value.accountId },
          data: { balance: { decrement: value.amount } },
        });

        // add to destination
        await tx.account.update({
          where: { id: value.toAccountId },
          data: { balance: { increment: value.amount } },
        });
      }

      // ===== SAVINGS ALLOCATION =====
      if (value.savingsAllocations?.length > 0) {
        const totalAlloc = value.savingsAllocations.reduce(
          (sum: number, a: any) => sum + Number(a.amount),
          0
        );

        if (totalAlloc > value.amount) {
          throw new Error("Savings allocation exceeds amount");
        }

        // validate ownership
        const goals = await tx.savingsGoal.findMany({
          where: {
            id: {
              in: value.savingsAllocations.map((a: any) => Number(a.goalId)),
            },
            user_id: auth.user.id,
          },
        });

        if (goals.length !== value.savingsAllocations.length) {
          throw new Error("Invalid savings goal");
        }

        await tx.savingsContribution.createMany({
          data: value.savingsAllocations.map((alloc: any) => ({
            goal_id: Number(alloc.goalId),
            transaction_id: transaction.id,
            amount: Number(alloc.amount),
            date: new Date(),
          })),
        });

        await Promise.all(
          value.savingsAllocations.map((alloc: any) =>
            tx.savingsGoal.update({
              where: { id: Number(alloc.goalId) },
              data: {
                current_amount: {
                  increment: Number(alloc.amount),
                },
              },
            })
          )
        );
      }

      return { transaction };
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const userId = auth.user.id;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as TransactionType | null;

    const accountId = searchParams.get('accountId');

    const sortByParam = searchParams.get('sortBy') || 'date';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // ✅ NEW FILTERS
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 🔒 whitelist sort fields
    const allowedSortFields = ['amount', 'date', 'created_at'];
    const sortBy = allowedSortFields.includes(sortByParam)
      ? sortByParam
      : 'date';

    const whereClause: Prisma.TransactionWhereInput = {
      user_id: userId,
    };

    // account filter
    if (accountId && !isNaN(Number(accountId))) {
      whereClause.account_id = Number(accountId);
    }

    // type filter
    if (type) {
      whereClause.type = type;
    }

    // search filter
    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 💰 amount range
    if (minAmount || maxAmount) {
      whereClause.amount = {
        ...(minAmount && !isNaN(Number(minAmount))
          ? { gte: Number(minAmount) }
          : {}),
        ...(maxAmount && !isNaN(Number(maxAmount))
          ? { lte: Number(maxAmount) }
          : {}),
      };
    }

    // 📅 date range
    if (startDate || endDate) {
      whereClause.date = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          category: true,
          account: true,
          receipts: {
            include: {
              items: true,
            },
          },
          savingsContributions: true,
        },
        orderBy: {
          [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: {
        data: transactions,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        } as TPaginationMeta,
      },
      message: "Success",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
});