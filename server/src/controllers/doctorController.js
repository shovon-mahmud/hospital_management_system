import Doctor from '../models/Doctor.js'
import createError from 'http-errors'
import { ok, created } from '../utils/response.js'

// Ensure a doctor profile exists for the logged-in doctor user
export const ensureMyProfile = async (req, res, next) => {
  try {
    const role = req.user?.role?.name
    if (role !== 'Doctor') throw createError(403, 'Forbidden')
    let doc = await Doctor.findOne({ user: req.user._id })
    if (!doc) {
      doc = await Doctor.create({ user: req.user._id, specialization: '', experienceYears: 0 })
      return created(res, doc, 'Doctor profile created')
    }
    ok(res, doc)
  } catch (e) { next(e) }
}
