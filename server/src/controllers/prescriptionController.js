import createError from 'http-errors';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Settings from '../models/Settings.js';

const ensureApptAccess = async (req, apptId) => {
  const appt = await Appointment.findById(apptId).populate('patient').populate('doctor');
  if (!appt) throw createError(404, 'Appointment not found');
  const role = req.user?.role?.name;
  if (role === 'Admin' || role === 'Receptionist') return appt;
  if (role === 'Doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || String(doctor._id) !== String(appt.doctor)) throw createError(403, 'Forbidden');
    return appt;
  }
  if (role === 'Patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient || String(patient._id) !== String(appt.patient)) throw createError(403, 'Forbidden');
    return appt;
  }
  throw createError(403, 'Forbidden');
};

export const createForAppointment = async (req, res, next) => {
  try {
    const { id: apptId } = req.params;
    const appt = await ensureApptAccess(req, apptId);

    const { medications, advice, followUpAfterDays, nextTests, warnings } = req.body;
    if (!Array.isArray(medications) || medications.length === 0) throw createError(400, 'At least one medication is required');

    const doc = await Doctor.findById(appt.doctor);
    const patient = await Patient.findById(appt.patient);
    if (!doc || !patient) throw createError(400, 'Invalid doctor or patient');

    const pres = await Prescription.create({
      appointment: appt._id,
      doctor: doc._id,
      patient: patient._id,
      medications,
      advice,
      followUpAfterDays,
      nextTests,
      warnings,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: pres });
  } catch (e) { next(e); }
};

export const getByAppointment = async (req, res, next) => {
  try {
    const appt = await ensureApptAccess(req, req.params.id);
    const pres = await Prescription.find({ appointment: appt._id }).sort({ createdAt: -1 });
    if (!pres || pres.length === 0) return res.status(404).json({ success: false, message: 'No prescription yet' });
    res.json({ success: true, data: pres }); // Return array now
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    if (!pres) throw createError(404, 'Prescription not found');
    await ensureApptAccess(req, pres.appointment);
    res.json({ success: true, data: pres });
  } catch (e) { next(e); }
};

export const listMine = async (req, res, next) => {
  try {
    const role = req.user?.role?.name;
    const query = {};
    if (role === 'Doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.json({ success: true, data: [] });
      query.doctor = doctor._id;
    } else if (role === 'Patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      if (!patient) return res.json({ success: true, data: [] });
      query.patient = patient._id;
    } else if (role === 'Admin' || role === 'Receptionist') {
      // no filter
    } else {
      return next(createError(403, 'Forbidden'));
    }
    const list = await Prescription.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    if (!pres) throw createError(404, 'Prescription not found');
    // Only authoring doctor or admin can update
    const role = req.user?.role?.name;
    if (role !== 'Admin') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor || String(doctor._id) !== String(pres.doctor)) throw createError(403, 'Forbidden');
    }
    const allowed = ['medications','advice','followUpAfterDays','nextTests','warnings','isArchived'];
    for (const k of Object.keys(req.body)) if (!allowed.includes(k)) delete req.body[k];
    const updated = await Prescription.findByIdAndUpdate(pres._id, { $set: req.body }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const pres = await Prescription.findById(req.params.id);
    if (!pres) throw createError(404, 'Prescription not found');
    const role = req.user?.role?.name;
    if (role !== 'Admin') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor || String(doctor._id) !== String(pres.doctor)) throw createError(403, 'Forbidden');
    }
    await Prescription.findByIdAndDelete(pres._id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

// Generate a branded PDF for the prescription
export const pdf = async (req, res, next) => {
  try {
    const pres = await Prescription.findById(req.params.id).populate([
      { path: 'doctor', populate: { path: 'user' } },
      { path: 'patient', populate: { path: 'user' } },
      { path: 'appointment' },
    ]);
    if (!pres) throw createError(404, 'Prescription not found');
    await ensureApptAccess(req, pres.appointment._id);

    // Fetch settings for signature
    const settings = await Settings.getInstance();
    const signature = settings?.general?.doctorSignature;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prescription-${pres._id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).text('Airelus Hospital', { align: 'left' });
    doc.moveDown(0.2).fontSize(10).text('Dhaka, Bangladesh');
    doc.moveDown();

    doc.fontSize(14).text('Prescription', { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date(pres.createdAt).toLocaleDateString()}`, { align: 'right' });

    doc.moveDown();
    doc.fontSize(12).text(`Doctor: Dr. ${pres.doctor?.user?.name} (${pres.doctor?.specialization || ''})`);
    doc.text(`Patient: ${pres.patient?.user?.name}`);
    doc.text(`Appointment: ${new Date(pres.appointment?.appointmentDate).toLocaleString()}`);

    doc.moveDown();
    doc.fontSize(12).text('Medications:', { underline: true });
    doc.moveDown(0.5);
    pres.medications.forEach((m, idx) => {
      doc.fontSize(11).text(`${idx + 1}. ${m.name} ${m.strength || ''} - ${m.dosage} ${m.frequency} ${m.duration}`);
      const sub = [m.form, m.route, m.instructions].filter(Boolean).join(' • ');
      if (sub) doc.fontSize(10).fillColor('#555').text(`   ${sub}`);
      if (m.prn) doc.fontSize(10).fillColor('#aa0000').text('   PRN');
      doc.fillColor('black');
    });

    if (pres.advice) {
      doc.moveDown();
      doc.fontSize(12).text('Advice:', { underline: true });
      doc.fontSize(10).text(pres.advice);
    }
    if (pres.nextTests?.length) {
      doc.moveDown();
      doc.fontSize(12).text('Recommended Tests:', { underline: true });
      pres.nextTests.forEach(t => doc.fontSize(10).text(`- ${t}`));
    }
    if (pres.followUpAfterDays != null) {
      doc.moveDown();
      doc.fontSize(10).text(`Follow-up after ${pres.followUpAfterDays} day(s).`);
    }

    doc.moveDown(2);

    // Signature section
    if (signature) {
      try {
        // If signature is base64 image data
        if (signature.startsWith('data:image')) {
          const base64Data = signature.replace(/^data:image\/\w+;base64,/, '');
          const sigBuf = Buffer.from(base64Data, 'base64');
          doc.image(sigBuf, doc.x, doc.y, { width: 120, height: 40 });
          doc.moveDown(3);
        }
      } catch (e) {
        // If signature parsing fails, just skip
      }
    }
    doc.fontSize(10).text('_________________________');
    doc.fontSize(9).text(`Dr. ${pres.doctor?.user?.name}`);
    doc.fontSize(8).text(pres.doctor?.specialization || 'Physician');

    doc.moveDown(2);

    // QR code linking to verification endpoint (public view could be implemented later)
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/prescriptions/${pres._id}`;
    const qr = await QRCode.toDataURL(verifyUrl);
    const qrImg = qr.replace(/^data:image\/png;base64,/, '');
    doc.image(Buffer.from(qrImg, 'base64'), doc.page.width - 120, doc.y, { width: 80 });
    doc.fontSize(8).text('Scan to view', doc.page.width - 120, doc.y + 85, { width: 80, align: 'center' });

    doc.end();
  } catch (e) { next(e); }
};
