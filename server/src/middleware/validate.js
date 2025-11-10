export const validate = (schema) => (req, res, next) => {
  const data = ['body','params','query'].reduce((acc, key) => ({ ...acc, [key]: req[key] }), {})
  const { error, value } = schema.validate(data, { abortEarly: false, allowUnknown: true })
  if (error) return res.status(400).json({ success: false, message: 'Validation error', data: error.details.map(d => d.message) })
  Object.assign(req, value)
  next()
}
