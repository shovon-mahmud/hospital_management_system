import createError from 'http-errors';
import dayjs from 'dayjs';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';
import { ok, created } from '../utils/response.js';
import { sendAppointmentConfirmation, sendRescheduleNotification } from '../utils/notifications.js';

export const create = async (req, res, next) => {
  try {
    let { patient, doctor, appointmentDate, notes } = req.body;
    const dt = dayjs(appointmentDate);
    if (!dt.isValid()) throw createError(400, 'Invalid date');

    // If patient field not provided, auto-detect from logged-in user (for Patient role)
    if (!patient && req.user.role.name === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc) throw createError(400, 'Patient profile not found');
      patient = patientDoc._id;
    }

    if (!patient) throw createError(400, 'Patient ID required');

    // Check doctor availability (simplified)
    const doc = await Doctor.findById(doctor);
    if (!doc) throw createError(400, 'Doctor not found');

    // Validate no overlapping appointments in +-30 minutes window
    const start = dt.subtract(30, 'minute').toDate();
    const end = dt.add(30, 'minute').toDate();
    const conflict = await Appointment.findOne({ doctor, appointmentDate: { $gte: start, $lte: end }, status: { $in: ['pending', 'confirmed'] } });
    if (conflict) throw createError(409, 'Slot unavailable');

    const appt = await Appointment.create({ patient, doctor, appointmentDate, notes, status: 'pending' });
    
    // Send confirmation email
    const populated = await Appointment.findById(appt._id).populate('patient').populate('doctor');
    if (populated?.patient?.user) {
      const patientUser = await (await import('../models/User.js')).default.findById(populated.patient.user);
      const doctorUser = await (await import('../models/User.js')).default.findById(populated.doctor.user);
      if (patientUser && doctorUser) {
        sendAppointmentConfirmation({
          to: patientUser.email,
          patientName: patientUser.name,
          doctorName: doctorUser.name,
          appointmentDate: appt.appointmentDate,
          appointmentId: appt._id
        }).catch(err => console.error('Confirmation email failed:', err));
        await Appointment.findByIdAndUpdate(appt._id, { confirmationSentAt: new Date(), confirmationMethod: 'email' });
      }
    }
    
    created(res, appt);
  } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let filter = {};
    if (req.user?.role?.name === 'Patient') {
      const patientDoc = await Patient.findOne({ user: req.user._id });
      if (!patientDoc) return ok(res, []);
      filter = { patient: patientDoc._id };
    }

    // Optionally filter by doctor when role is Doctor
    if (req.user?.role?.name === 'Doctor') {
      // Lazy import to avoid circular? Reuse Doctor model here
      const docModel = (await import('../models/Doctor.js')).default;
      const doc = await docModel.findOne({ user: req.user._id });
      if (!doc) return ok(res, []);
      filter = { doctor: doc._id };
    }

    let query = (await import('../models/Appointment.js')).default
      .find(filter)
      .skip(skip)
      .limit(Number(limit))
      .populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user department' } })
      .populate('bill')
      .sort({ appointmentDate: -1 });
    const data = await query;
    ok(res, data);
  } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get appointment to check ownership
    const appt = await Appointment.findById(id).populate('doctor');
    if (!appt) throw createError(404, 'Appointment not found');
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || appt.doctor._id.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot update status of other doctors appointments');
      }
    }
    // Admin and Receptionist can update any appointment status
    
    const updated = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    ok(res, updated, 'Status updated');
  } catch (e) { next(e); }
};

export const generateBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items = [] } = req.body;
  const subtotal = items.reduce((s, it) => s + (it.qty * it.unitPrice), 0);
  const tax = Number((subtotal * 0.15).toFixed(2));
    const total = subtotal + tax;
    const bill = await Bill.create({ appointment: id, items, subtotal, tax, total, status: 'unpaid', provider: 'stripe' });
    await Appointment.findByIdAndUpdate(id, { bill: bill._id });
    ok(res, bill, 'Bill generated');
  } catch (e) { next(e); }
};

// Reschedule appointment
export const reschedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, reason } = req.body;
    
    // Get original appointment
    const original = await Appointment.findById(id).populate('patient').populate('doctor');
    if (!original) throw createError(404, 'Appointment not found');
    
    // Check authorization - only patient, doctor, admin, or receptionist
    const { user } = req;
    const userRole = user.role?.name;
    
    // Ownership validation
    if (userRole === 'Patient') {
      const patientProfile = await Patient.findOne({ user: user._id });
      if (!patientProfile || original.patient._id.toString() !== patientProfile._id.toString()) {
        throw createError(403, 'Cannot reschedule others appointments');
      }
    } else if (userRole === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || original.doctor._id.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot reschedule other doctors appointments');
      }
    }
    // Admin and Receptionist can reschedule any appointment
    
    // Validate new date is in future
    if (new Date(newDate) < new Date()) {
      throw createError(400, 'New appointment date must be in the future');
    }
    
    // Check for conflicts (simplified - checks if doctor has appointment within 1 hour)
    const conflictStart = new Date(new Date(newDate).getTime() - 60 * 60 * 1000);
    const conflictEnd = new Date(new Date(newDate).getTime() + 60 * 60 * 1000);
    const conflict = await Appointment.findOne({
      doctor: original.doctor._id,
      appointmentDate: { $gte: conflictStart, $lte: conflictEnd },
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: original._id }
    });
    if (conflict) {
      throw createError(409, 'Doctor not available at this time');
    }
    
    // Create new appointment
    const newAppt = await Appointment.create({
      patient: original.patient._id,
      doctor: original.doctor._id,
      appointmentDate: newDate,
      notes: original.notes,
      status: 'pending',
      isFollowUp: original.isFollowUp,
      parentAppointment: original.parentAppointment,
      rescheduledFrom: original._id,
      originalDate: original.originalDate || original.appointmentDate,
      rescheduledReason: reason
    });
    
    // Mark original as rescheduled
    await Appointment.findByIdAndUpdate(id, {
      status: 'rescheduled',
      rescheduledTo: newAppt._id
    });
    
    // Send notification
    const patientUser = await (await import('../models/User.js')).default.findById(original.patient.user);
    const doctorUser = await (await import('../models/User.js')).default.findById(original.doctor.user);
    if (patientUser && doctorUser) {
      sendRescheduleNotification({
        to: patientUser.email,
        patientName: patientUser.name,
        doctorName: doctorUser.name,
        oldDate: original.appointmentDate,
        newDate: newAppt.appointmentDate,
        reason
      }).catch(err => console.error('Reschedule notification failed:', err));
      await Appointment.findByIdAndUpdate(newAppt._id, { confirmationSentAt: new Date(), confirmationMethod: 'email' });
    }
    
    ok(res, newAppt, 'Appointment rescheduled');
  } catch (e) { next(e); }
};

// Resend confirmation
export const resendConfirmation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id).populate('patient').populate('doctor');
    if (!appt) throw createError(404, 'Appointment not found');
    
    const patientUser = await (await import('../models/User.js')).default.findById(appt.patient.user);
    const doctorUser = await (await import('../models/User.js')).default.findById(appt.doctor.user);
    if (!patientUser || !doctorUser) {
      throw createError(400, 'User data not found');
    }
    
    await sendAppointmentConfirmation({
      to: patientUser.email,
      patientName: patientUser.name,
      doctorName: doctorUser.name,
      appointmentDate: appt.appointmentDate,
      appointmentId: appt._id
    });
    
    await Appointment.findByIdAndUpdate(id, { confirmationSentAt: new Date(), confirmationMethod: 'email' });
    ok(res, { message: 'Confirmation sent' });
  } catch (e) { next(e); }
};

// Confirm appointment (patient confirms via email link)
export const confirmAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findByIdAndUpdate(
      id,
      { confirmedByPatient: true, confirmedAt: new Date(), status: 'confirmed' },
      { new: true }
    );
    if (!appt) throw createError(404, 'Appointment not found');
    ok(res, appt, 'Appointment confirmed');
  } catch (e) { next(e); }
};

// Schedule follow-up
export const scheduleFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { followUpDate, reason } = req.body;
    
    const parent = await Appointment.findById(id).populate('doctor');
    if (!parent) throw createError(404, 'Appointment not found');
    
    // Ownership validation - only the treating doctor, admin, or receptionist can schedule follow-up
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || parent.doctor._id.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot schedule follow-up for other doctors patients');
      }
    }
    // Admin and Receptionist can schedule follow-ups for any doctor
    
    // Validate follow-up date
    if (new Date(followUpDate) < new Date()) {
      throw createError(400, 'Follow-up date must be in the future');
    }
    
    // Create follow-up appointment
    const followUp = await Appointment.create({
      patient: parent.patient,
      doctor: parent.doctor,
      appointmentDate: followUpDate,
      notes: reason,
      status: 'pending',
      isFollowUp: true,
      parentAppointment: parent._id,
      followUpReason: reason,
      followUpDate
    });
    
    // Update parent with follow-up reference
    await Appointment.findByIdAndUpdate(id, { followUpDate, followUpReason: reason });
    
    // Send confirmation
    const populated = await Appointment.findById(followUp._id).populate('patient').populate('doctor');
    const patientUser = await (await import('../models/User.js')).default.findById(populated.patient.user);
    const doctorUser = await (await import('../models/User.js')).default.findById(populated.doctor.user);
    if (patientUser && doctorUser) {
      sendAppointmentConfirmation({
        to: patientUser.email,
        patientName: patientUser.name,
        doctorName: doctorUser.name,
        appointmentDate: followUp.appointmentDate,
        appointmentId: followUp._id
      }).catch(err => console.error('Confirmation email failed:', err));
      await Appointment.findByIdAndUpdate(followUp._id, { confirmationSentAt: new Date(), confirmationMethod: 'email' });
    }
    
    ok(res, followUp, 'Follow-up scheduled');
  } catch (e) { next(e); }
};
