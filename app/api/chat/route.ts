import { tool, streamText, generateText, stepCountIs, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Your Prisma client path

import { createOllama } from 'ollama-ai-provider-v2';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/serverSession';
import { TAuthUser, withAuth } from '@/lib/apiAuth';
import { mapChatHistory } from '@/lib/ai';

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/api',
});
export const GET = withAuth(async (req: Request, auth: TAuthUser) => {
  try {
    const histories = await prisma.chatHistory.findMany({
      where: {
        user_id: auth.user.id
      },
      include: {
        chatExecutionHistories: {
          include: {
            chatExecutionHistoryItems: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 20
    })
    const transactionIds = new Set<number>()
    const savingsContributionIds = new Set<number>()
    const accountIds = new Set<number>()

    histories
      .flatMap(h => h.chatExecutionHistories)
      .forEach((chatHistory) => {
        chatHistory.chatExecutionHistoryItems.forEach((i) => {
          if (i.account_id) accountIds.add(i.account_id)
          if (i.savings_contribution_id) savingsContributionIds.add(i.savings_contribution_id)
          if (i.transaction_id) transactionIds.add(i.transaction_id)
        })
      })

    const [transactions, savingsContributions, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          id: { in: [...transactionIds] },
          user_id: auth.user.id
        },
      }),
      prisma.savingsContribution.findMany({
        where: {
          id: { in: [...savingsContributionIds] },
          transaction: {
            user_id: auth.user.id
          }
        },
      }),
      prisma.account.findMany({
        where: {
          id: { in: [...accountIds] },
          user_id: auth.user.id
        },
      }),
    ])
    const accountMap = new Map(accounts.map(a => [a.id, a]))
    const transactionMap = new Map(transactions.map(t => [t.id, t]))
    const savingsContributionMap = new Map(
      savingsContributions.map(s => [s.id, s])
    )

    const formatted = histories
      .slice()
      .reverse()
      .map(history => ({
        ...history,
        chatExecutionHistories: history.chatExecutionHistories.map(exec => ({
          ...exec,
          chatExecutionHistoryItems: exec.chatExecutionHistoryItems.map(item => ({
            ...item,
            account: item.account_id ? accountMap.get(item.account_id) : null,
            transaction: item.transaction_id ? transactionMap.get(item.transaction_id) : null,
            savingsContribution: item.savings_contribution_id
              ? savingsContributionMap.get(item.savings_contribution_id)
              : null,
          })),
        })),
      }))

    return NextResponse.json({
      message: "Success",
      data: formatted,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
})
export async function POST(req: Request) {
  try {
    const { text: prompt, messages } = await req.json();
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Save user message
    await prisma.chatHistory.create({
      data: {
        user_id: userId,
        role: 'user',
        content: prompt,
      },
    });

    // Fetch financial data
    const [accounts, transactions, savingsGoals] = await Promise.all([
      prisma.account.findMany({ where: { user_id: userId } }),
      prisma.transaction.findMany({
        where: { user_id: userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 200
      }),
      prisma.savingsGoal.findMany({ where: { user_id: userId } }),
    ]);

    const context = {
      accounts,
      transactions,
      savingsGoals
    };

    const result = await streamText({
      model: ollama(process.env.OLLAMA_MODEL!),
      system: `
You are a personal finance assistant.

Rules:
- Only answer questions
- Use the provided data to analyze
- Give insights and suggestions
`,
      messages: [
        {
          role: "system",
          content: `User financial data:\n${JSON.stringify(context)}`
        },
        ...(await convertToModelMessages(messages.slice(-10)))
      ],
      onFinish: async ({ text }) => {
        await prisma.chatHistory.create({
          data: {
            user_id: userId,
            role: 'assistant',
            content: text,
          },
        });
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}