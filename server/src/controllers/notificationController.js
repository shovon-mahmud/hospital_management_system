import Notification from '../models/Notification.js'
import { ok, created } from '../utils/response.js'

export const create = async (req, res, next) => {
  try {
    const { user, type, title, message, meta } = req.body
    const doc = await Notification.create({ user, type, title, message, meta })
    try {
      const io = req.app.get('io')
      if (io) {
        io.to(String(user)).emit('notification', { _id: doc._id, type, title, message, meta, createdAt: doc.createdAt })
      }
    } catch (e) {
      // ignore socket errors
    }
    created(res, doc)
  } catch (e) { next(e) }
}

export const list = async (req, res, next) => {
  try {
    const filter = {}
    if (req.user) filter.user = req.user._id
    const data = await Notification.find(filter).sort({ createdAt: -1 }).limit(200)
    ok(res, data)
  } catch (e) { next(e) }
}

export const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body
    const doc = await Notification.findByIdAndUpdate(id, updates, { new: true })
    ok(res, doc)
  } catch (e) { next(e) }
}
