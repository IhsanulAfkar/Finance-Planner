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
    merchant: Joi.string().required(),
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

    // 1. Determine Input Type
    if (contentType.includes("application/json")) {
      // Handle JSON Input
      body = await req.json();
      // Omit image processing for JSON requests
    } else if (contentType.includes("multipart/form-data")) {
      // Handle Form Data Input
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

    // 2. Schema Validation (Joi)
    const { error, value } = createTransactionSchema.validate(body, { abortEarly: false });
    if (error) {
      return NextResponse.json(
        { message: "Validation error", errors: error.details.map((err) => err.message) },
        { status: 400 }
      );
    }

    // 3. Optional Image Validation (only for FormData)
    let receiptFileUrl: string | null = null
    if (receiptImage) {
      const imageError = validateImage(receiptImage);
      if (imageError) return NextResponse.json({ message: imageError }, { status: 400 });

      receiptFileUrl = await saveImage(receiptImage, auth.user.id)
    }

    // check account
    const account = await prisma.account.findFirst({
      where: {
        user_id: auth.user.id,
        id: value.accountId
      }
    })
    if (!account) return NextResponse.json({ message: "Account not found" }, { status: 404 })
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          user_id: auth.user.id,
          account_id: value.accountId,
          amount: value.amount,
          type: value.type,
          category_id: value.categoryId,
          description: value.description,
          date: value.date ? new Date(value.date) : new Date(),
          source: value.source,
        },
      });

      const balanceAdjustment = value.type === "INCOME" ? value.amount : -value.amount;
      await tx.account.update({
        where: { id: value.accountId },
        data: { balance: { increment: balanceAdjustment } },
      });
      let createdReceipt
      if (value.receipt) {
        createdReceipt = await tx.receipt.create({
          data: {
            user_id: auth.user.id,
            merchant: value.receipt.merchant,
            total: value.receipt.total,
            date: value.receipt.date ? new Date(value.receipt.date) : new Date(),
            image_url: receiptFileUrl, // URL from JSON or previous upload
            transaction_id: transaction.id,
            items: value.receipt.items ? {
              create: value.receipt.items.map((item: any) => ({
                name: item.name,
                price: item.amount,
              })),
            } : undefined,
          },
        });
      }

      if (value.savingsAllocations?.length > 0) {
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

      return { transaction, receipt: createdReceipt };
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const userId = auth.user.id
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as TransactionType | null;

    // 1. Get accountId from params
    const accountId = searchParams.get('accountId');

    const sortBy = searchParams.get('sortBy') || 'date';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    const whereClause: Prisma.TransactionWhereInput = {
      user_id: userId,
    };

    // 2. Add to whereClause if present
    if (accountId) {
      whereClause.account_id = parseInt(accountId);
    }

    if (type) {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          category: true,
          account: true,
          receipts: {
            include: {
              items: true
            }
          },
          savingsContributions: true
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
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        } as TPaginationMeta,
      },
      message: "Success"
    });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
})