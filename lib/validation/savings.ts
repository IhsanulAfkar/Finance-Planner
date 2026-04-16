import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50),
  type: Joi.string().valid("INCOME", "EXPENSE"),
})
export const createGoalSchema = Joi.object({
  title: Joi.string().min(2).max(50),
  category_id: Joi.number().required(),
  target_amount: Joi.number().required(),
  monthly_target: Joi.number().optional(),
  date: Joi.date().required(),
})