import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveImage } from "@/lib/storage"
import Joi from "joi"
import { TAuthUser, withAuth } from "@/lib/apiAuth"
export const createExpenseSchema = Joi.object({
  title: Joi.string().required(),
  category_id: Joi.number().optional(),
  account_id: Joi.number().optional(),
  items: Joi.string().optional(),
  date: Joi.date().iso().required(),
  total_amount: Joi.number().required(),
  merchant: Joi.string().optional()
})
const itemSchema = Joi.array().items(
  Joi.object({
    name: Joi.string().required(),
    amount: Joi.number().required(),
  })
);
export const POST = withAuth(async (req, auth) => {
  try {
    const formData = await req.formData()

    const title = formData.get("title") as string
    const date = formData.get("date") as string
    const merchant = formData.get("merchant") as string
    const total_amount = Number(formData.get("total_amount"))
    const category_id = Number(formData.get("category_id"))
    const account_id = Number(formData.get("account_id"))
    const items = formData.get("items") as string | null// json string
    const receipt = formData.get("receipt") as File | null

    const { error } = createExpenseSchema.validate({
      title,
      category_id,
      items,
      date,
      total_amount,
      account_id,
      merchant
    })

    if (error) {
      return NextResponse.json(
        { message: error.details[0].message },
        { status: 400 }
      )
    }
    // validate item
    let itemObject: any = null
    try {
      if (items) {
        itemObject = JSON.parse(items)
        const joiResult = itemSchema.validate(itemObject)
        if (joiResult.error) {
          return NextResponse.json({
            message: joiResult.error.details[0].message,

          }, { status: 400 })
        }
      }

    } catch (error) {
      console.error(error)
      return NextResponse.json({
        message: 'Invalid items value',

      }, { status: 400 })
    }
    let receiptPath = null

    if (receipt && receipt.size > 0) {
      receiptPath = await saveImage(receipt, auth.user.id)
    }
    // check category
    const category = await prisma.transactionCategory.findFirst({
      where: {
        id: category_id,
        user_id: auth.user.id
      }
    })
    if (!category) {
      return NextResponse.json({
        message: "Invalid Category"
      }, { status: 400 })
    }
    // check account
    const account = await prisma.account.findFirst({
      where: {
        id: account_id,
        user_id: auth.user.id
      }
    })
    if (!account) {
      return NextResponse.json({
        message: "Account Not Found"
      }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: total_amount,
        date,
        type: 'EXPENSE',
        category_id: category?.id,
        account_id: account.id,
        user_id: auth.user.id,
      },
    })
    const receiptData = receiptPath ? await prisma.receipt.create({
      data: {
        date,
        user_id: auth.user.id,
        image_url: receiptPath,
        merchant,
        total: total_amount,
        is_verified: true,
        transaction_id: transaction.id,
      }
    }) : undefined
    return NextResponse.json({
      message: "Task created",
      data: transaction,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
})
export const GET = withAuth(async (req: NextRequest, auth: TAuthUser) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: auth.user.id
      },
      include: {
        account: true,
        category: true,
        receipts: true
      }
    })
    return NextResponse.json({ message: 'success', data: transactions })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 })
  }
})