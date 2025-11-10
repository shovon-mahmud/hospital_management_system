import Joi from 'joi'

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(6).required()
  })
})

export const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(6).required(),
    roleName: Joi.string().optional()
  })
})

export const verifyEmailSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
    code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
      'string.length': 'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain only digits'
    })
  })
})

export const resendCodeSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email({ tlds: { allow: false } }).required()
  })
})
