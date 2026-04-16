import Joi from "joi"

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  color: Joi.string().allow(null, ""),
  icon: Joi.string().allow(null, ""),
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
})

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50),
  color: Joi.string().allow(null, ""),
  icon: Joi.string().allow(null, ""),
  type: Joi.string().valid("INCOME", "EXPENSE"),
})