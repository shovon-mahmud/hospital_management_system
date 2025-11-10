import { DoctorAvailability, DayOff } from '../models/DoctorAvailability.js';
import createError from 'http-errors';
import { ok, created } from '../utils/response.js';

// Get doctor's availability schedule
export const getAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Optional: get availability for specific date
    
    let filter = { doctor: doctorId, isAvailable: true };
    
    if (date) {
      const targetDate = new Date(date);
      filter.effectiveFrom = { $lte: targetDate };
      filter.$or = [
        { effectiveTo: { $gte: targetDate } },
        { effectiveTo: null }
      ];
    }
    
    const availability = await DoctorAvailability.find(filter).populate('doctor', 'user');
    ok(res, availability);
  } catch (e) { next(e); }
};

// Create doctor availability schedule
export const createAvailability = async (req, res, next) => {
  try {
    const { doctor, dayOfWeek, workingHours, breaks, isAvailable, effectiveFrom, effectiveTo } = req.body;
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const Doctor = (await import('../models/Doctor.js')).default;
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || doctor !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot create availability for other doctors');
      }
    }
    // Admin can create availability for any doctor
    
    // Check if schedule already exists for this day
    const existing = await DoctorAvailability.findOne({
      doctor,
      dayOfWeek,
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: new Date(effectiveFrom) } }
      ]
    });
    
    if (existing) {
      throw createError(409, `Schedule already exists for ${dayOfWeek}`);
    }
    
    const schedule = await DoctorAvailability.create({
      doctor,
      dayOfWeek,
      workingHours,
      breaks: breaks || [],
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo
    });
    
    created(res, schedule);
  } catch (e) { next(e); }
};

// Update doctor availability
export const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get the schedule first for ownership check
    const schedule = await DoctorAvailability.findById(id);
    if (!schedule) throw createError(404, 'Schedule not found');
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const Doctor = (await import('../models/Doctor.js')).default;
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || schedule.doctor.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot update other doctors availability');
      }
    }
    // Admin can update any doctor's availability
    
    const updated = await DoctorAvailability.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    ok(res, updated, 'Schedule updated');
  } catch (e) { next(e); }
};

// Delete doctor availability
export const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the schedule first for ownership check
    const schedule = await DoctorAvailability.findById(id);
    if (!schedule) throw createError(404, 'Schedule not found');
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const Doctor = (await import('../models/Doctor.js')).default;
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || schedule.doctor.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot delete other doctors availability');
      }
    }
    // Admin can delete any doctor's availability
    
    await DoctorAvailability.findByIdAndDelete(id);
    ok(res, null, 'Schedule deleted');
  } catch (e) { next(e); }
};

// Get doctor's days off
export const getDaysOff = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;
    
    let filter = { doctor: doctorId };
    
    if (startDate || endDate) {
      filter.$or = [
        { startDate: { $gte: new Date(startDate || new Date()), $lte: new Date(endDate || '2099-12-31') } },
        { endDate: { $gte: new Date(startDate || new Date()), $lte: new Date(endDate || '2099-12-31') } }
      ];
    }
    
    const daysOff = await DayOff.find(filter).populate('doctor', 'user').sort({ startDate: 1 });
    ok(res, daysOff);
  } catch (e) { next(e); }
};

// Create day off
export const createDayOff = async (req, res, next) => {
  try {
    const { doctor, startDate, endDate, type, reason } = req.body;
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const Doctor = (await import('../models/Doctor.js')).default;
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || doctor !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot create days off for other doctors');
      }
    }
    // Admin can create days off for any doctor
    
    // Check for overlapping days off
    const overlap = await DayOff.findOne({
      doctor,
      $or: [
        { startDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
        { endDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
        { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(endDate) } }
      ]
    });
    
    if (overlap) {
      throw createError(409, 'Overlapping day off already exists');
    }
    
    const dayOff = await DayOff.create({
      doctor,
      startDate,
      endDate,
      type,
      reason
    });
    
    created(res, dayOff);
  } catch (e) { next(e); }
};

// Update day off
export const updateDayOff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get the day off first for ownership check
    const dayOff = await DayOff.findById(id);
    if (!dayOff) throw createError(404, 'Day off not found');
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const Doctor = (await import('../models/Doctor.js')).default;
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || dayOff.doctor.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot update other doctors days off');
      }
    }
    // Admin can update any doctor's days off
    
    const updated = await DayOff.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    ok(res, updated, 'Day off updated');
  } catch (e) { next(e); }
};

// Delete day off
export const deleteDayOff = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the day off first for ownership check
    const dayOff = await DayOff.findById(id);
    if (!dayOff) throw createError(404, 'Day off not found');
    
    // Ownership validation for Doctor role
    const { user } = req;
    const userRole = user.role?.name;
    if (userRole === 'Doctor') {
      const Doctor = (await import('../models/Doctor.js')).default;
      const doctorProfile = await Doctor.findOne({ user: user._id });
      if (!doctorProfile || dayOff.doctor.toString() !== doctorProfile._id.toString()) {
        throw createError(403, 'Cannot delete other doctors days off');
      }
    }
    // Admin can delete any doctor's days off
    
    await DayOff.findByIdAndDelete(id);
    ok(res, null, 'Day off deleted');
  } catch (e) { next(e); }
};
