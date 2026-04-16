import z from "zod";

export const incomeSchema = z.object({
  source: z.string().min(1, "Source is required"),
  accountId: z.string().min(1, "accountId is required"),
  amount: z.coerce.number().min(0.01),
  category: z.string(),
  date: z.string(),
  frequency: z.enum(["one-time", "weekly", "monthly", "yearly"]),
  description: z.string().optional(),
  // Array of savings objects
  savingsAllocations: z.array(z.object({
    savingsGoalId: z.string().min(1, "Goal is required"),
    amount: z.number().min(1, "Amount must be > 0"),
  })).optional(),
});
export type IncomeFormData = z.infer<typeof incomeSchema>;