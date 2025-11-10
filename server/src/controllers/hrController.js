import { ok, created } from '../utils/response.js'
import createError from 'http-errors'
import User from '../models/User.js'
import Role from '../models/Role.js'
import Employee from '../models/Employee.js'
import LeaveRequest from '../models/LeaveRequest.js'
import Payroll from '../models/Payroll.js'
import Notification from '../models/Notification.js'

// Users directory (Admin/HR)
export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).populate('role').sort({ name: 1 })
    ok(res, users)
  } catch (e) { next(e) }
}

// Employees CRUD
export const listEmployees = async (req, res, next) => {
  try { ok(res, await Employee.find({}).populate('user').populate('department')) } catch (e) { next(e) }
}
export const createEmployee = async (req, res, next) => {
  try { created(res, await Employee.create(req.body)) } catch (e) { next(e) }
}
export const updateEmployee = async (req, res, next) => {
  try { ok(res, await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })) } catch (e) { next(e) }
}
export const deleteEmployee = async (req, res, next) => {
  try { ok(res, await Employee.findByIdAndDelete(req.params.id)) } catch (e) { next(e) }
}

// Leave requests
export const listLeaves = async (req, res, next) => {
  try {
    const role = req.user?.role?.name
    const filter = (role === 'Admin' || role === 'HR') ? {} : { user: req.user._id }
    // Optional filters
    const { status, from, to } = req.query || {}
    if (status) filter.status = status
    if (from || to) {
      filter.startDate = {}
      if (from) filter.startDate.$gte = new Date(from)
      if (to) filter.startDate.$lte = new Date(to)
    }
    const data = await LeaveRequest.find(filter).populate('user').populate('approver').sort({ createdAt: -1 })
    ok(res, data)
  } catch (e) { next(e) }
}
export const createLeave = async (req, res, next) => {
  try {
    const payload = { ...req.body, user: req.user._id }
    const doc = await LeaveRequest.create(payload)
    // Notify Admin and HR users
    try {
      const hrRole = await Role.findOne({ name: 'HR' })
      const adminRole = await Role.findOne({ name: 'Admin' })
      const targets = await User.find({ role: { $in: [hrRole?._id, adminRole?._id].filter(Boolean) } })
      const io = req.app.get('io')
      await Promise.all(targets.map(async (u) => {
        const n = await Notification.create({ user: u._id, title: 'New Leave Request', message: `${req.user.name} submitted a leave request.` })
        if (io) io.to(String(u._id)).emit('notification', { _id: n._id, title: n.title, message: n.message })
      }))
  } catch (err) { /* ignore notification failures */ }
    created(res, doc)
  } catch (e) { next(e) }
}
export const decideLeave = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['approved','rejected'].includes(status)) throw createError(400, 'Invalid status')
    const doc = await LeaveRequest.findByIdAndUpdate(id, { status, approver: req.user._id, decidedAt: new Date() }, { new: true }).populate('user')
    // Notify requester
    try {
      const io = req.app.get('io')
      const n = await Notification.create({ user: doc.user._id, title: 'Leave Request Update', message: `Your leave request was ${status}.` })
      if (io) io.to(String(doc.user._id)).emit('notification', { _id: n._id, title: n.title, message: n.message })
  } catch (err) { /* ignore notification failures */ }
    ok(res, doc)
  } catch (e) { next(e) }
}

// Payroll
export const listPayroll = async (req, res, next) => {
  try {
    const role = req.user?.role?.name
    const filter = (role === 'Admin' || role === 'HR') ? {} : { user: req.user._id }
    const { month, status } = req.query || {}
    if (month) filter.month = month
    if (status) filter.status = status
    const data = await Payroll.find(filter).populate('user').sort({ createdAt: -1 })
    ok(res, data)
  } catch (e) { next(e) }
}
export const createPayroll = async (req, res, next) => {
  try {
    const { user, month, baseSalary = 0, allowances = 0, deductions = 0 } = req.body
    const netPay = Number(baseSalary) + Number(allowances) - Number(deductions)
    const doc = await Payroll.create({ user, month, baseSalary, allowances, deductions, netPay, status: 'unpaid' })
    created(res, doc)
  } catch (e) { next(e) }
}
export const markPayrollPaid = async (req, res, next) => {
  try {
    const { id } = req.params
    const doc = await Payroll.findByIdAndUpdate(id, { status: 'paid', paidAt: new Date() }, { new: true }).populate('user')
    // Notify employee
    try {
      const io = req.app.get('io')
      const n = await Notification.create({ user: doc.user._id, title: 'Payroll Paid', message: `Your salary for ${doc.month} has been paid. Net: ৳${doc.netPay}` })
      if (io) io.to(String(doc.user._id)).emit('notification', { _id: n._id, title: n.title, message: n.message })
  } catch (err) { /* ignore notification failures */ }
    ok(res, doc)
  } catch (e) { next(e) }
}
