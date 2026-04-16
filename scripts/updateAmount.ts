import 'dotenv/config'
import { TransactionType } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"


export default async function updateAmount() {
  console.log('🔄 Recalculating account balances...')

  // 1. Reset balances
  await prisma.account.updateMany({
    data: { balance: 0 },
  })

  // 2. Aggregate transactions
  const transactions = await prisma.transaction.findMany({
    select: {
      account_id: true,
      amount: true,
      type: true,
    },
  })

  const accountMap = new Map<number, number>()

  for (const t of transactions) {
    const prev = accountMap.get(t.account_id) || 0
    const value =
      t.type === TransactionType.INCOME
        ? t.amount
        : -t.amount

    accountMap.set(t.account_id, prev + value)
  }

  // 3. Batch update (NO transaction)
  await Promise.all(
    Array.from(accountMap.entries()).map(([accountId, balance]) =>
      prisma.account.update({
        where: { id: accountId },
        data: { balance },
      })
    )
  )

  console.log('✅ Account balances updated')

  // ------------------------

  console.log('🔄 Recalculating savings goals...')

  await prisma.savingsGoal.updateMany({
    data: { current_amount: 0 },
  })

  const contributions = await prisma.savingsContribution.findMany({
    select: {
      goal_id: true,
      amount: true,
    },
  })

  const goalMap = new Map<number, number>()

  for (const c of contributions) {
    const prev = goalMap.get(c.goal_id) || 0
    goalMap.set(c.goal_id, prev + c.amount)
  }

  await Promise.all(
    Array.from(goalMap.entries()).map(([goalId, amount]) =>
      prisma.savingsGoal.update({
        where: { id: goalId },
        data: { current_amount: amount },
      })
    )
  )

  console.log('🎉 Done recalculating everything')
}