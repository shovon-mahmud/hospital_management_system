import { Router } from 'express';
import { auth as requireAuth, roleCheck } from '../middleware/auth.js';
import * as Auth from '../controllers/authController.js';
import { crudFactory } from '../controllers/crudFactory.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
// import Bill from '../models/Bill.js';
import * as Bills from '../controllers/billController.js';
import Department from '../models/Department.js';
import Inventory from '../models/Inventory.js';
// Notifications
import * as Noti from '../controllers/notificationController.js';
import Log from '../models/Log.js';
import Role from '../models/Role.js';
import * as Appt from '../controllers/appointmentController.js';
import * as Users from '../controllers/userController.js';
import * as Availability from '../controllers/doctorAvailabilityController.js';
import { ensureMyProfile } from '../controllers/doctorController.js';
import * as Queue from '../controllers/waitingQueueController.js';
import * as HR from '../controllers/hrController.js';
import * as SettingsCtrl from '../controllers/settingsController.js';
import * as Prescriptions from '../controllers/prescriptionController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema, verifyEmailSchema, resendCodeSchema } from '../validation/auth.js';
import { createApptSchema, statusSchema } from '../validation/appointment.js';

const router = Router();

// Auth
router.post('/auth/register', validate(registerSchema), Auth.register);
router.post('/auth/login', validate(loginSchema), Auth.login);
router.post('/auth/refresh', Auth.refresh);
router.post('/auth/logout', requireAuth, Auth.logout);
router.get('/auth/verify-email', Auth.verifyEmailLink);
router.post('/auth/verify-email', validate(verifyEmailSchema), Auth.verifyEmail);
router.post('/auth/resend-code', validate(resendCodeSchema), Auth.resendVerificationCode);
router.post('/auth/request-reset', Auth.requestPasswordReset);
router.post('/auth/reset-password', Auth.resetPassword);

// Patients
const patientCrud = crudFactory(Patient, ['user']);
router.get('/patients', requireAuth, roleCheck(['Admin','Receptionist','Doctor']), patientCrud.list);
router.get('/patients/:id', requireAuth, roleCheck(['Admin','Receptionist','Doctor']), patientCrud.get);
router.post('/patients', requireAuth, roleCheck(['Admin','Receptionist']), patientCrud.create);
router.put('/patients/:id', requireAuth, roleCheck(['Admin','Receptionist']), patientCrud.update);
router.delete('/patients/:id', requireAuth, roleCheck(['Admin']), patientCrud.remove);

// Doctors
const doctorCrud = crudFactory(Doctor, ['user','department']);
router.get('/doctors', requireAuth, roleCheck(['Admin','Receptionist','Patient','Doctor','HR']), doctorCrud.list);
router.get('/doctors/:id', requireAuth, roleCheck(['Admin','Receptionist','Doctor','Patient']), doctorCrud.get);
router.post('/doctors', requireAuth, roleCheck(['Admin']), doctorCrud.create);
router.put('/doctors/:id', requireAuth, roleCheck(['Admin']), doctorCrud.update);
router.delete('/doctors/:id', requireAuth, roleCheck(['Admin']), doctorCrud.remove);
// Ensure profile for Doctor self-service
router.post('/doctors/me/ensure', requireAuth, roleCheck(['Doctor']), ensureMyProfile);

// Appointments
const apptCrud = crudFactory(Appointment, ['patient','doctor','bill']);
router.get('/appointments', requireAuth, roleCheck(['Admin','Receptionist','Doctor','Patient']), Appt.list);
router.get('/appointments/:id', requireAuth, roleCheck(['Admin','Receptionist','Doctor','Patient']), apptCrud.get);
router.post('/appointments', requireAuth, roleCheck(['Patient','Receptionist','Admin']), validate(createApptSchema), Appt.create);
router.put('/appointments/:id', requireAuth, roleCheck(['Admin','Receptionist']), apptCrud.update);
router.put('/appointments/:id/status', requireAuth, roleCheck(['Receptionist','Doctor','Admin']), validate(statusSchema), Appt.updateStatus);
router.post('/appointments/:id/bill', requireAuth, roleCheck(['Receptionist','Admin']), Appt.generateBill);
router.post('/appointments/:id/reschedule', requireAuth, roleCheck(['Patient','Receptionist','Admin','Doctor']), Appt.reschedule);
router.post('/appointments/:id/resend-confirmation', requireAuth, roleCheck(['Admin','Receptionist']), Appt.resendConfirmation);
router.post('/appointments/:id/confirm', Appt.confirmAppointment); // Public link from email
router.post('/appointments/:id/follow-up', requireAuth, roleCheck(['Doctor','Admin','Receptionist']), Appt.scheduleFollowUp);

// Billing
router.get('/bills', requireAuth, roleCheck(['Admin','Receptionist','Patient','Doctor']), Bills.list);
router.get('/bills/:id', requireAuth, roleCheck(['Admin','Receptionist','Patient','Doctor']), Bills.get);
router.put('/bills/:id', requireAuth, roleCheck(['Admin','Receptionist']), Bills.update);

// Doctor Availability
router.get('/doctors/:doctorId/availability', requireAuth, roleCheck(['Admin','Receptionist','Doctor','Patient']), Availability.getAvailability);
router.post('/doctors/:doctorId/availability', requireAuth, roleCheck(['Admin','Doctor']), Availability.createAvailability);
router.put('/availability/:id', requireAuth, roleCheck(['Admin','Doctor']), Availability.updateAvailability);
router.delete('/availability/:id', requireAuth, roleCheck(['Admin','Doctor']), Availability.deleteAvailability);

// Doctor Days Off
router.get('/doctors/:doctorId/days-off', requireAuth, roleCheck(['Admin','Receptionist','Doctor']), Availability.getDaysOff);
router.post('/doctors/:doctorId/days-off', requireAuth, roleCheck(['Admin','Doctor']), Availability.createDayOff);
router.put('/days-off/:id', requireAuth, roleCheck(['Admin','Doctor']), Availability.updateDayOff);
router.delete('/days-off/:id', requireAuth, roleCheck(['Admin','Doctor']), Availability.deleteDayOff);

// Waiting Queue
router.get('/waiting-queue', requireAuth, roleCheck(['Admin','Receptionist','Doctor']), Queue.getQueue);
router.post('/waiting-queue', requireAuth, roleCheck(['Patient','Admin','Receptionist']), Queue.joinQueue);
router.put('/waiting-queue/:id', requireAuth, roleCheck(['Admin','Receptionist']), Queue.updateQueue);
router.delete('/waiting-queue/:id', requireAuth, roleCheck(['Patient','Admin','Receptionist']), Queue.leaveQueue);
router.post('/waiting-queue/:id/schedule', requireAuth, roleCheck(['Admin','Receptionist']), Queue.scheduleFromQueue);

// Departments (HR)
const deptCrud = crudFactory(Department);
router.get('/departments', requireAuth, roleCheck(['Admin','HR']), deptCrud.list);
router.post('/departments', requireAuth, roleCheck(['Admin']), deptCrud.create);
router.put('/departments/:id', requireAuth, roleCheck(['Admin']), deptCrud.update);
router.delete('/departments/:id', requireAuth, roleCheck(['Admin']), deptCrud.remove);

// Inventory & Pharmacy
const invCrud = crudFactory(Inventory);
router.get('/inventory', requireAuth, roleCheck(['Admin','Receptionist','HR']), invCrud.list);
router.post('/inventory', requireAuth, roleCheck(['Admin','HR']), invCrud.create);
router.put('/inventory/:id', requireAuth, roleCheck(['Admin','HR']), invCrud.update);
router.delete('/inventory/:id', requireAuth, roleCheck(['Admin']), invCrud.remove);

// Notifications
router.get('/notifications', requireAuth, Noti.list);
router.post('/notifications', requireAuth, roleCheck(['Admin','Doctor','Receptionist']), Noti.create);
router.put('/notifications/:id', requireAuth, Noti.update);

// HR Module
// Users directory
router.get('/hr/users', requireAuth, roleCheck(['Admin','HR']), HR.listUsers);
// Employees CRUD
router.get('/hr/employees', requireAuth, roleCheck(['Admin','HR']), HR.listEmployees);
router.post('/hr/employees', requireAuth, roleCheck(['Admin','HR']), HR.createEmployee);
router.put('/hr/employees/:id', requireAuth, roleCheck(['Admin','HR']), HR.updateEmployee);
router.delete('/hr/employees/:id', requireAuth, roleCheck(['Admin','HR']), HR.deleteEmployee);
// Leave requests
router.get('/hr/leaves', requireAuth, roleCheck(['Admin','HR','Receptionist','Doctor','Patient']), HR.listLeaves);
router.post('/hr/leaves', requireAuth, roleCheck(['Admin','HR','Receptionist','Doctor','Patient']), HR.createLeave);
router.put('/hr/leaves/:id/decision', requireAuth, roleCheck(['Admin','HR']), HR.decideLeave);
// Payroll
router.get('/hr/payroll', requireAuth, roleCheck(['Admin','HR','Receptionist','Doctor','Patient']), HR.listPayroll);
router.post('/hr/payroll', requireAuth, roleCheck(['Admin','HR']), HR.createPayroll);
router.put('/hr/payroll/:id/paid', requireAuth, roleCheck(['Admin','HR']), HR.markPayrollPaid);

// Logs
const logCrud = crudFactory(Log, ['user']);
router.get('/logs', requireAuth, roleCheck(['Admin']), logCrud.list);

// Settings (Admin only)
router.get('/settings', requireAuth, roleCheck(['Admin']), SettingsCtrl.getSettings);
router.put('/settings', requireAuth, roleCheck(['Admin']), SettingsCtrl.updateSettings);
router.post('/settings/test-smtp', requireAuth, roleCheck(['Admin']), SettingsCtrl.testSmtpConnection);
router.post('/settings/send-test-email', requireAuth, roleCheck(['Admin']), SettingsCtrl.sendTestEmail);
router.get('/settings/system-stats', requireAuth, roleCheck(['Admin']), SettingsCtrl.getSystemStats);

// Roles (Admin)
router.get('/roles', requireAuth, roleCheck(['Admin']), async (req, res, next) => {
	try {
		const roles = await Role.find({}).sort({ name: 1 });
		res.json({ success: true, data: roles });
	} catch (e) { next(e); }
});

// Users (Admin limited)
router.put('/users/:id/role', requireAuth, roleCheck(['Admin']), Users.updateRole);
router.put('/users/:id/profile', requireAuth, roleCheck(['Admin']), Users.updateProfile);

// Prescriptions

/**
 * @swagger
 * /appointments/{id}/prescription:
 *   post:
 *     summary: Create a prescription for an appointment
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medications
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - dosage
 *                     - frequency
 *                     - duration
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Medication name
 *                     dosage:
 *                       type: string
 *                       description: Dosage (e.g., "500mg")
 *                     frequency:
 *                       type: string
 *                       description: Frequency (e.g., "Twice daily")
 *                     duration:
 *                       type: string
 *                       description: Duration (e.g., "7 days")
 *                     route:
 *                       type: string
 *                       description: Route of administration (e.g., "Oral")
 *                     instructions:
 *                       type: string
 *                       description: Additional instructions
 *                     isPRN:
 *                       type: boolean
 *                       description: Take as needed
 *               advice:
 *                 type: string
 *                 description: General medical advice
 *               recommendedTests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of recommended tests
 *               followUpDays:
 *                 type: number
 *                 description: Number of days until follow-up appointment
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Doctor or Admin role
 *       404:
 *         description: Appointment not found
 */
router.post('/appointments/:id/prescription', requireAuth, roleCheck(['Doctor','Admin']), Prescriptions.createForAppointment);

/**
 * @swagger
 * /appointments/{id}/prescription:
 *   get:
 *     summary: Get all prescriptions for an appointment
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Array of prescriptions for the appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires authorized role
 *       404:
 *         description: No prescriptions found for appointment
 */
router.get('/appointments/:id/prescription', requireAuth, roleCheck(['Doctor','Admin','Receptionist','Patient']), Prescriptions.getByAppointment);

/**
 * @swagger
 * /prescriptions/mine:
 *   get:
 *     summary: Get all prescriptions for the authenticated user
 *     description: Returns prescriptions where user is patient (for Patient role) or doctor (for Doctor role)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/prescriptions/mine', requireAuth, roleCheck(['Doctor','Patient','Admin','Receptionist']), Prescriptions.listMine);

/**
 * @swagger
 * /prescriptions/{id}:
 *   get:
 *     summary: Get a prescription by ID
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prescription not found
 */
router.get('/prescriptions/:id', requireAuth, roleCheck(['Doctor','Patient','Admin','Receptionist']), Prescriptions.get);

/**
 * @swagger
 * /prescriptions/{id}:
 *   put:
 *     summary: Update a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *               advice:
 *                 type: string
 *               recommendedTests:
 *                 type: array
 *                 items:
 *                   type: string
 *               followUpDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Doctor or Admin role
 *       404:
 *         description: Prescription not found
 */
router.put('/prescriptions/:id', requireAuth, roleCheck(['Doctor','Admin']), Prescriptions.update);

/**
 * @swagger
 * /prescriptions/{id}:
 *   delete:
 *     summary: Delete a prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Doctor or Admin role
 *       404:
 *         description: Prescription not found
 */
router.delete('/prescriptions/:id', requireAuth, roleCheck(['Doctor','Admin']), Prescriptions.remove);

/**
 * @swagger
 * /prescriptions/{id}/pdf:
 *   get:
 *     summary: Download prescription as PDF
 *     description: Generates a PDF with prescription details, QR code for verification, and optional doctor signature (configured in Settings)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prescription not found
 *       500:
 *         description: PDF generation error
 */
router.get('/prescriptions/:id/pdf', requireAuth, roleCheck(['Doctor','Patient','Admin','Receptionist']), Prescriptions.pdf);

export default router;
