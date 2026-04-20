import z from "zod";

export const expenseFormSchema = z.object({
  title: z.string().min(1, "Source is required"),
  date: z.string(),
  accountId: z.string(),
  categoryId: z.string().nullish(),
  merchant: z.string().nullish(),
  amount: z.coerce.number().min(0.01),
  description: z.string().nullish(),
  // Array of savings objects
  items: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    amount: z.coerce.number().min(1, "Amount must be > 0"),
  })).optional(),
});
export const receiptScanSchema = z.object({
  title: z.string().min(1, "Source is required"),
  date: z.iso.datetime(),
  merchant: z.string().optional(),
  amount: z.coerce.number().min(0.01),
  description: z.string().nullish(),
  // Array of savings objects
  items: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    amount: z.coerce.number().min(1, "Amount must be > 0"),
  })).optional(),
});
export type ExpenseFormData = z.infer<typeof expenseFormSchema>;