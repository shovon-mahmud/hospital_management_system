import createError from 'http-errors';
import { ok } from '../utils/response.js';
import Bill from '../models/Bill.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let filter = {};
    const role = req.user?.role?.name;
    if (role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc) return ok(res, []);
      const appts = await Appointment.find({ patient: patientDoc._id }).select('_id');
      filter = { appointment: { $in: appts.map(a => a._id) } };
    } else if (role === 'Doctor') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (!doctorDoc) return ok(res, []);
      const appts = await Appointment.find({ doctor: doctorDoc._id }).select('_id');
      filter = { appointment: { $in: appts.map(a => a._id) } };
    }

    const data = await Bill.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .populate({ 
        path: 'appointment', 
        populate: [
          { path: 'patient', populate: { path: 'user', select: 'name email' } }, 
          { path: 'doctor', populate: { path: 'user', select: 'name email' } }
        ]
      });
    ok(res, data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user?.role?.name;
    let bill = await Bill.findById(id).populate({ 
      path: 'appointment', 
      populate: [
        { path: 'patient', populate: { path: 'user', select: 'name email' } }, 
        { path: 'doctor', populate: { path: 'user', select: 'name email' } }
      ]
    });
    if (!bill) throw createError(404, 'Bill not found');
    if (role === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc || String(bill.appointment?.patient?._id) !== String(patientDoc._id)) return next(createError(403, 'Forbidden'));
    }
    if (role === 'Doctor') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (!doctorDoc || String(bill.appointment?.doctor?._id) !== String(doctorDoc._id)) return next(createError(403, 'Forbidden'));
    }
    ok(res, bill);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['unpaid','paid','refunded'];
    if (!allowed.includes(status)) throw createError(400, 'Invalid status');
    const bill = await Bill.findByIdAndUpdate(id, { status }, { new: true });
    if (!bill) throw createError(404, 'Bill not found');
    ok(res, bill, 'Bill updated');
  } catch (e) { next(e); }
};
