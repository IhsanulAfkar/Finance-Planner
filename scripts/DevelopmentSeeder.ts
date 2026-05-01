import 'dotenv/config'
import { AccountType, FrequencyType, PrismaClient, TransactionType } from "@/generated/prisma/client";
import { adapter } from "@/lib/prisma";
import { faker } from '@faker-js/faker';
const prisma = new PrismaClient({
  adapter: adapter
});

async function main() {
  // 🔴 IMPORTANT: Use existing user
  const user = await prisma.user.findFirst();

  if (!user) {
    throw new Error("No user found. Please create a user first.");
  }

  console.log("Seeding for user:", user.email);

  // =========================
  // 1. ACCOUNTS
  // =========================
  const accounts = await Promise.all(
    [AccountType.CASH, AccountType.SAVINGS, AccountType.INVESTMENT].map((type) =>
      prisma.account.create({
        data: {
          user_id: user.id,
          type,
          balance: faker.number.float({ min: 1_000_000, max: 50_000_000 }),
          description: faker.lorem.words(3),
        },
      })
    )
  );

  // =========================
  // 2. TRANSACTION CATEGORIES
  // =========================
  const expenseCategories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
  ];

  const incomeCategories = [
    "Salary",
    "Freelance",
    "Bonus",
    "Investment Return",
  ];

  const categories = [];

  for (const name of expenseCategories) {
    categories.push(
      await prisma.transactionCategory.create({
        data: {
          user_id: user.id,
          name,
          type: TransactionType.EXPENSE,
          color: faker.color.rgb(),
          icon: "shopping-cart",
        },
      })
    );
  }

  for (const name of incomeCategories) {
    categories.push(
      await prisma.transactionCategory.create({
        data: {
          user_id: user.id,
          name,
          type: TransactionType.INCOME,
          color: faker.color.rgb(),
          icon: "wallet",
        },
      })
    );
  }

  // =========================
  // 3. TRANSACTIONS + RECEIPTS
  // =========================
  const transactions = [];

  for (let i = 0; i < 300; i++) {
    const type = faker.helpers.arrayElement([
      TransactionType.INCOME,
      TransactionType.EXPENSE,
    ]);

    const category = faker.helpers.arrayElement(
      categories.filter((c) => c.type === type)
    );

    const account = faker.helpers.arrayElement(accounts);

    const transaction = await prisma.transaction.create({
      data: {
        user_id: user.id,
        account_id: account.id,
        category_id: category.id,
        amount:
          type === TransactionType.INCOME
            ? faker.number.float({ min: 1_000_000, max: 10_000_000 })
            : faker.number.float({ min: 10_000, max: 1_000_000 }),
        type,
        description: faker.lorem.sentence(),
        date: faker.date.past({ years: 1 }),
        frequency: faker.helpers.arrayElement(Object.values(FrequencyType)),
        source: faker.company.name(),
      },
    });

    transactions.push(transaction);

    // Add receipt for some expenses
    if (type === TransactionType.EXPENSE && Math.random() > 0.5) {
      const receipt = await prisma.receipt.create({
        data: {
          user_id: user.id,
          merchant: faker.company.name(),
          total: transaction.amount,
          date: transaction.date,
          transaction_id: transaction.id,
          image_url: faker.image.url(),
          is_verified: Math.random() > 0.3,
        },
      });

      // receipt items
      for (let j = 0; j < faker.number.int({ min: 1, max: 5 }); j++) {
        await prisma.receiptItem.create({
          data: {
            receipt_id: receipt.id,
            name: faker.commerce.productName(),
            price: faker.number.float({ min: 5000, max: 200000 }),
          },
        });
      }
    }
  }

  // =========================
  // 4. SAVINGS CATEGORIES + GOALS
  // =========================
  const savingsCategory = await prisma.savingsCategory.create({
    data: {
      name: "General Savings",
      user_id: user.id,
    },
  });

  const goals = [];

  for (let i = 0; i < 5; i++) {
    const goal = await prisma.savingsGoal.create({
      data: {
        user_id: user.id,
        title: faker.lorem.words(2),
        category_id: savingsCategory.id,
        target_amount: faker.number.float({ min: 5_000_000, max: 50_000_000 }),
        monthly_target: faker.number.float({ min: 500_000, max: 5_000_000 }),
        target_date: faker.date.future(),
      },
    });

    goals.push(goal);
  }

  // =========================
  // 5. SAVINGS CONTRIBUTIONS
  // =========================
  for (const goal of goals) {
    const relatedTransactions = faker.helpers.arrayElements(transactions, 10);

    for (const trx of relatedTransactions) {
      await prisma.savingsContribution.create({
        data: {
          goal_id: goal.id,
          transaction_id: trx.id,
          amount: faker.number.float({ min: 10000, max: 500000 }),
          date: trx.date,
        },
      });
    }
  }

  // =========================
  // 6. CHAT HISTORY + EXECUTION
  // =========================
  for (let i = 0; i < 50; i++) {
    const chat = await prisma.chatHistory.create({
      data: {
        user_id: user.id,
        role: faker.helpers.arrayElement(["user", "assistant"]),
        content: faker.lorem.sentence(),
      },
    });

    const execution = await prisma.chatExecutionHistory.create({
      data: {
        chat_id: chat.id,
        method: faker.helpers.arrayElement([
          "create_transaction",
          "analyze_spending",
          "create_goal",
        ]),
        payload: {
          dummy: faker.lorem.word(),
        },
      },
    });

    await prisma.chatExecutionHistoryItem.create({
      data: {
        execution_id: execution.id,
        transaction_id: faker.helpers.arrayElement(transactions).id,
        account_id: faker.helpers.arrayElement(accounts).id,
      },
    });
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });