import Joi from 'joi'

export const createApptSchema = Joi.object({
  body: Joi.object({
    patient: Joi.string().hex().length(24).optional(),
    doctor: Joi.string().hex().length(24).required(),
    appointmentDate: Joi.date().iso().required(),
    notes: Joi.string().allow('', null).optional()
  })
})

export const statusSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({ status: Joi.string().valid('pending','confirmed','completed','canceled').required() })
})
