import WaitingQueue from '../models/WaitingQueue.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import createError from 'http-errors';
import { ok, created } from '../utils/response.js';

// Get waiting queue entries
export const getQueue = async (req, res, next) => {
  try {
    const { doctorId, patientId, status } = req.query;
    
    let filter = {};
    if (doctorId) filter.doctor = doctorId;
    if (patientId) filter.patient = patientId;
    if (status) filter.status = status;
    
    // Default: only show active waiting entries
    if (!status) filter.status = 'waiting';

    // If role is Doctor and no explicit doctorId filter provided,
    // default to the logged-in doctor's queue entries
    if (!doctorId && req.user?.role?.name === 'Doctor') {
      const doc = await Doctor.findOne({ user: req.user._id });
      if (doc) filter.doctor = doc._id;
    }
    
    const queue = await WaitingQueue.find(filter)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('scheduledAppointment')
      .sort({ priority: -1, createdAt: 1 }); // High priority first, then FIFO
    
    ok(res, queue);
  } catch (e) { next(e); }
};

// Join waiting queue
export const joinQueue = async (req, res, next) => {
  try {
    const { patient, doctor, requestedDate, flexibleDates, priority, notes } = req.body;
    
    // Verify patient authorization if role is Patient
    const { user } = req;
    const userRole = user.role?.name;
    let patientId = patient;
    
    if (userRole === 'Patient') {
      const patientProfile = await Patient.findOne({ user: user._id });
      if (!patientProfile) throw createError(404, 'Patient profile not found');
      patientId = patientProfile._id;
    }
    
    // Check if patient already in queue for this doctor
    const existing = await WaitingQueue.findOne({
      patient: patientId,
      doctor,
      status: 'waiting'
    });
    
    if (existing) {
      throw createError(409, 'Already in queue for this doctor');
    }
    
    // Set expiration (default 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const entry = await WaitingQueue.create({
      patient: patientId,
      doctor,
      requestedDate: requestedDate || null,
      flexibleDates: flexibleDates || [],
      priority: priority || 'medium',
      notes,
      expiresAt
    });
    
    created(res, entry);
  } catch (e) { next(e); }
};

// Update queue entry (change priority, dates, etc.)
export const updateQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const entry = await WaitingQueue.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!entry) throw createError(404, 'Queue entry not found');
    ok(res, entry, 'Queue entry updated');
  } catch (e) { next(e); }
};

// Leave queue (cancel)
export const leaveQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the queue entry first
    const entry = await WaitingQueue.findById(id).populate('patient');
    if (!entry) throw createError(404, 'Queue entry not found');
    
    // Ownership validation for Patient role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Patient') {
      const patientProfile = await Patient.findOne({ user: user._id });
      if (!patientProfile || entry.patient._id.toString() !== patientProfile._id.toString()) {
        throw createError(403, 'Cannot remove other patients queue entries');
      }
    }
    // Admin and Receptionist can remove any queue entry
    
    const updated = await WaitingQueue.findByIdAndUpdate(
      id,
      { status: 'canceled' },
      { new: true }
    );
    
    ok(res, updated, 'Left queue');
  } catch (e) { next(e); }
};

// Schedule from queue (staff action)
export const scheduleFromQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appointmentDate, notes } = req.body;
    
    const entry = await WaitingQueue.findById(id);
    if (!entry) throw createError(404, 'Queue entry not found');
    if (entry.status !== 'waiting') throw createError(400, 'Entry not in waiting status');
    
    // Create appointment
    const appointment = await Appointment.create({
      patient: entry.patient,
      doctor: entry.doctor,
      appointmentDate,
      notes: notes || entry.notes,
      status: 'pending'
    });
    
    // Update queue entry
    await WaitingQueue.findByIdAndUpdate(id, {
      status: 'scheduled',
      scheduledAppointment: appointment._id
    });
    
    // Send notification (reuse appointment confirmation)
    const populated = await Appointment.findById(appointment._id).populate('patient').populate('doctor');
    const patientUser = await (await import('../models/User.js')).default.findById(populated.patient.user);
    const doctorUser = await (await import('../models/User.js')).default.findById(populated.doctor.user);
    if (patientUser && doctorUser) {
      const { sendAppointmentConfirmation } = await import('../utils/notifications.js');
      sendAppointmentConfirmation({
        to: patientUser.email,
        patientName: patientUser.name,
        doctorName: doctorUser.name,
        appointmentDate: appointment.appointmentDate,
        appointmentId: appointment._id
      }).catch(err => console.error('Queue scheduling notification failed:', err));
    }
    
    ok(res, appointment, 'Appointment scheduled from queue');
  } catch (e) { next(e); }
};
