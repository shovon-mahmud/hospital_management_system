import 'dotenv/config';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { connectDB } from '../config/db.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Bill from '../models/Bill.js';
import WaitingQueue from '../models/WaitingQueue.js';
import Inventory from '../models/Inventory.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import Notification from '../models/Notification.js';
import { DoctorAvailability, DayOff } from '../models/DoctorAvailability.js';
import Prescription from '../models/Prescription.js';

const run = async () => {
  try {
    await connectDB();

    // Clear all existing data
    console.log('🗑️  Clearing all existing data...');
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Department.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Bill.deleteMany({}),
      WaitingQueue.deleteMany({}),
      Inventory.deleteMany({}),
      Employee.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Payroll.deleteMany({}),
      Notification.deleteMany({}),
      DoctorAvailability.deleteMany({}),
      DayOff.deleteMany({})
    ]);
    console.log('✅ Database cleared');

    // Create Roles
    console.log('👥 Creating roles...');
    const roles = ['Admin','Doctor','Receptionist','Patient','HR'];
    const insertedRoles = {};
    for (const r of roles) {
      const role = await Role.create({ name: r });
      insertedRoles[r] = role;
    }
    console.log('✅ Roles created');

    // Create Users
    console.log('👤 Creating users...');
    const createUser = async ({ name, email, roleName, password = 'Pass@123' }) => {
      const user = await User.create({
        name,
        email,
        password,
        role: insertedRoles[roleName]._id,
        isEmailVerified: true
      });
      console.log(`  ✓ ${name} (${email}) - ${password}`);
      return user;
    };

    // Admin users
    const adminUser = await createUser({ name: 'Sakura Haruno', email: 'admin@hms.bd', roleName: 'Admin', password: 'Admin@123' });
    
    // HR users
    const hrUser1 = await createUser({ name: 'Hinata Hyuga', email: 'hr@hms.bd', roleName: 'HR' });
    const hrUser2 = await createUser({ name: 'Ino Yamanaka', email: 'hr2@hms.bd', roleName: 'HR' });
    
    // Receptionist users
    const recUser1 = await createUser({ name: 'Mikasa Ackerman', email: 'reception@hms.bd', roleName: 'Receptionist' });
    const recUser2 = await createUser({ name: 'Asuna Yuuki', email: 'reception2@hms.bd', roleName: 'Receptionist' });
    
    // Doctor users
    const doc1User = await createUser({ name: 'Nami', email: 'dr.nami@hms.bd', roleName: 'Doctor' });
    const doc2User = await createUser({ name: 'Tsunade Senju', email: 'dr.tsunade@hms.bd', roleName: 'Doctor' });
    const doc3User = await createUser({ name: 'Orihime Inoue', email: 'dr.orihime@hms.bd', roleName: 'Doctor' });
    const doc4User = await createUser({ name: 'Erza Scarlet', email: 'dr.erza@hms.bd', roleName: 'Doctor' });
    const doc5User = await createUser({ name: 'Rukia Kuchiki', email: 'dr.rukia@hms.bd', roleName: 'Doctor' });
    const doc6User = await createUser({ name: 'Winry Rockbell', email: 'dr.winry@hms.bd', roleName: 'Doctor' });
    
    // Patient users
    const pat1User = await createUser({ name: 'Chitoge Kirisaki', email: 'chitoge@example.bd', roleName: 'Patient' });
    const pat2User = await createUser({ name: 'Yui Hirasawa', email: 'yui@example.bd', roleName: 'Patient' });
    const pat3User = await createUser({ name: 'Kagome Higurashi', email: 'kagome@example.bd', roleName: 'Patient' });
    const pat4User = await createUser({ name: 'Megumin', email: 'megumin@example.bd', roleName: 'Patient' });
    const pat5User = await createUser({ name: 'Taiga Aisaka', email: 'taiga@example.bd', roleName: 'Patient' });
    const pat6User = await createUser({ name: 'Mayuri Shiina', email: 'mayuri@example.bd', roleName: 'Patient' });
    const pat7User = await createUser({ name: 'Kurisu Makise', email: 'kurisu@example.bd', roleName: 'Patient' });
    const pat8User = await createUser({ name: 'Rem', email: 'rem@example.bd', roleName: 'Patient' });
    const pat9User = await createUser({ name: 'Ram', email: 'ram@example.bd', roleName: 'Patient' });
    const pat10User = await createUser({ name: 'Emilia', email: 'emilia@example.bd', roleName: 'Patient' });

    // Departments
    console.log('🏥 Creating departments...');
    const deptCardio = await Department.create({ name: 'Cardiology', description: 'Heart and cardiovascular care - হৃদরোগ বিভাগ' });
    const deptDerm = await Department.create({ name: 'Dermatology', description: 'Skin care and treatment - চর্মরোগ বিভাগ' });
    const deptNeuro = await Department.create({ name: 'Neurology', description: 'Brain and nervous system - স্নায়ুরোগ বিভাগ' });
    const deptOrtho = await Department.create({ name: 'Orthopedics', description: 'Bone and joint care - হাড় ও জোড়া বিভাগ' });
    const deptPeds = await Department.create({ name: 'Pediatrics', description: 'Child healthcare - শিশু স্বাস্থ্য বিভাগ' });
    const deptGyne = await Department.create({ name: 'Gynecology', description: 'Women\'s health - স্ত্রীরোগ বিভাগ' });
    const deptAdmin = await Department.create({ name: 'Administration', description: 'Hospital administration - প্রশাসন বিভাগ' });
    await Department.create({ name: 'Pharmacy', description: 'Medicine dispensary - ফার্মেসি বিভাগ' });
    console.log('✅ Departments created');

    // Doctors (profiles)
    console.log('👨‍⚕️ Creating doctor profiles...');
    const bdLocations = [
      { building: 'Airelus Hospital - Gulshan Tower', buildingNo: 'GT-1', floor: '3' },
      { building: 'Airelus Hospital - Dhanmondi Wing', buildingNo: 'DM-2', floor: '4' },
      { building: 'Airelus Hospital - Banani Center', buildingNo: 'BN-3', floor: '2' },
      { building: 'Airelus Hospital - Uttara Complex', buildingNo: 'UT-5', floor: '5' }
    ];
    
    const createDoctor = async (user, spec, dept, fee, expYears, location) => {
      const doc = await Doctor.create({
        user: user._id,
        specialization: spec,
        experienceYears: expYears,
        qualifications: ['MBBS (DMC)', 'FCPS', 'MD'],
        languages: ['Bengali', 'English'],
        bio: `Experienced ${spec} specialist serving Bangladesh healthcare`,
        department: dept._id,
        consultationFee: fee,
        buildingName: location.building,
        buildingNo: location.buildingNo,
        floorNo: location.floor,
        roomNo: String(Math.floor(Math.random()*15)+301)
      });
      console.log(`  ✓ Dr. ${user.name} - ${spec}`);
      return doc;
    };

    const doc1 = await createDoctor(doc1User, 'Cardiology', deptCardio, 1500, 12, bdLocations[0]);
    const doc2 = await createDoctor(doc2User, 'Dermatology', deptDerm, 1200, 15, bdLocations[0]);
    const doc3 = await createDoctor(doc3User, 'Neurology', deptNeuro, 1800, 10, bdLocations[1]);
    const doc4 = await createDoctor(doc4User, 'Orthopedics', deptOrtho, 1400, 8, bdLocations[1]);
    const doc5 = await createDoctor(doc5User, 'Pediatrics', deptPeds, 1000, 7, bdLocations[2]);
    const doc6 = await createDoctor(doc6User, 'Gynecology', deptGyne, 1300, 11, bdLocations[3]);

    // Doctor availability (normalized table used by UI)
    console.log('📅 Setting up doctor availability...');
    const setupAvailability = async (doctor, schedule = 'full') => {
      const days = schedule === 'full' 
        ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        : ['Sunday','Monday','Tuesday','Wednesday','Thursday'];
      
      const entries = days.map(d => ({
        doctor: doctor._id,
        dayOfWeek: d,
        workingHours: { start: d === 'Saturday' ? '10:00' : '09:00', end: d === 'Saturday' ? '14:00' : '17:00' },
        breaks: d !== 'Saturday' ? [{ start: '12:30', end: '13:30', reason: 'Lunch Break' }] : [],
        isAvailable: true,
        effectiveFrom: new Date()
      }));
      
      await DoctorAvailability.insertMany(entries);
    };

    await setupAvailability(doc1);
    await setupAvailability(doc2);
    await setupAvailability(doc3);
    await setupAvailability(doc4, 'alt');
    await setupAvailability(doc5);
    await setupAvailability(doc6);
    
    // Some day-off entries
    await DayOff.create({ 
      doctor: doc1._id, 
      startDate: dayjs().add(10, 'day').toDate(), 
      endDate: dayjs().add(11, 'day').toDate(), 
      reason: 'Medical Conference in Dhaka', 
      type: 'training' 
    });
    console.log('✅ Availability configured');

    // Patients (profiles)
    console.log('🏥 Creating patient profiles...');
    const bdAddresses = [
      'House 12, Road 5, Dhanmondi, Dhaka-1205',
      'Flat 3B, Green Plaza, Gulshan-2, Dhaka-1212',
      'Plot 45, Block C, Bashundhara R/A, Dhaka-1229',
      'House 78, Sector 7, Uttara, Dhaka-1230',
      'Road 11, Banani DOHS, Dhaka-1213',
      'Village: Khilgaon, PO: Manda, Dist: Narayanganj',
      'Holding 23, Ward 4, Gazipur Sadar, Gazipur-1700',
      'House 56, Mirpur-10, Dhaka-1216',
      'Flat 2A, Star Arcade, Mohakhali, Dhaka-1212',
      'House 89, Shyamoli, Dhaka-1207'
    ];
    
    const createPatient = async (user, gender, phone, address, medical = {}, extraInfo = {}) => {
      const patient = await Patient.create({
        user: user._id,
        gender,
        dateOfBirth: extraInfo.dateOfBirth || new Date(1990 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
        bloodGroup: extraInfo.bloodGroup || ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
        heightCm: extraInfo.heightCm || 150 + Math.floor(Math.random() * 30),
        weightKg: extraInfo.weightKg || 45 + Math.floor(Math.random() * 35),
        contact: { 
          phone, 
          address,
          emergencyContact: extraInfo.emergencyContact || `+880${Math.floor(1000000000 + Math.random() * 9000000000)}`
        },
        insurance: { provider: 'Bangladesh Health Insurance', number: `BHI-${Math.floor(100000 + Math.random() * 900000)}` },
        medical: {
          history: medical.history || [],
          allergies: medical.allergies || [],
          prescriptions: medical.prescriptions || []
        }
      });
      console.log(`  ✓ ${user.name} - ${address.split(',')[0]}`);
      return patient;
    };

    const pat1 = await createPatient(pat1User, 'Female', '+8801712345001', bdAddresses[0], { history: ['Asthma'], allergies: ['Penicillin'] });
    const pat2 = await createPatient(pat2User, 'Female', '+8801812345002', bdAddresses[1], { history: ['Diabetes Type 2'], allergies: [] });
    const pat3 = await createPatient(pat3User, 'Female', '+8801912345003', bdAddresses[2], { history: [], allergies: ['Sulfa drugs'] });
    const pat4 = await createPatient(pat4User, 'Female', '+8801612345004', bdAddresses[3], { history: ['Hypertension'], allergies: [] });
    const pat5 = await createPatient(pat5User, 'Female', '+8801512345005', bdAddresses[4], { history: [], allergies: ['Peanuts'] });
    const pat6 = await createPatient(pat6User, 'Female', '+8801412345006', bdAddresses[5], { history: ['Migraine'], allergies: [] });
    const pat7 = await createPatient(pat7User, 'Female', '+8801312345007', bdAddresses[6], { history: [], allergies: [] });
    const pat8 = await createPatient(pat8User, 'Female', '+8801212345008', bdAddresses[7], { history: ['Anemia'], allergies: ['Iodine'] });
    const pat9 = await createPatient(pat9User, 'Female', '+8801112345009', bdAddresses[8], { history: [], allergies: [] });
    const pat10 = await createPatient(pat10User, 'Female', '+8801012345010', bdAddresses[9], { history: ['Thyroid disorder'], allergies: [] });

    // Appointments
    console.log('📋 Creating appointments...');
    const now = dayjs();
    const appointments = [
      { patient: pat1, doctor: doc1, date: now.hour(10).minute(0), status: 'confirmed', notes: 'Chest pain checkup', priority: 'high' },
      { patient: pat2, doctor: doc2, date: now.hour(14).minute(0), status: 'confirmed', notes: 'Skin rash treatment', priority: 'medium' },
      { patient: pat3, doctor: doc3, date: now.hour(11).minute(0), status: 'pending', notes: 'Headache consultation', priority: 'medium' },
      { patient: pat4, doctor: doc4, date: now.subtract(1, 'day').hour(15).minute(0), status: 'completed', notes: 'Knee pain follow-up', priority: 'low' },
      { patient: pat5, doctor: doc5, date: now.hour(16).minute(0), status: 'confirmed', notes: 'Child vaccination', priority: 'high' },
      { patient: pat6, doctor: doc6, date: now.add(1, 'day').hour(10).minute(0), status: 'pending', notes: 'Pregnancy checkup', priority: 'high' },
      { patient: pat7, doctor: doc1, date: now.subtract(2, 'day').hour(9).minute(0), status: 'completed', notes: 'Heart monitoring', priority: 'high' },
      { patient: pat8, doctor: doc2, date: now.add(2, 'day').hour(11).minute(0), status: 'pending', notes: 'Acne treatment', priority: 'low' },
      { patient: pat9, doctor: doc3, date: now.subtract(3, 'day').hour(14).minute(0), status: 'completed', notes: 'Migraine consultation', priority: 'medium' },
      { patient: pat10, doctor: doc4, date: now.add(3, 'day').hour(15).minute(0), status: 'pending', notes: 'Back pain assessment', priority: 'medium' },
        { patient: pat1, doctor: doc5, date: now.hour(12).minute(0), status: 'canceled', notes: 'Could not attend', priority: 'low' },
      { patient: pat2, doctor: doc6, date: now.subtract(1, 'day').hour(10).minute(0), status: 'completed', notes: 'Routine checkup', priority: 'medium' }
    ];

    const createdAppts = [];
    for (const a of appointments) {
      const appt = await Appointment.create({
        patient: a.patient._id,
        doctor: a.doctor._id,
        appointmentDate: a.date.toDate(),
        status: a.status,
        notes: a.notes,
        priority: a.priority
      });
      createdAppts.push(appt);
    }
    console.log(`✅ ${createdAppts.length} appointments created`);

    // Prescriptions (sample for a few appointments)
    console.log('📝 Creating sample prescriptions...');
    const sampleMeds = [
      [
        { name: 'Amoxicillin', strength: '500mg', dosage: '1 tablet', frequency: '3 times daily', duration: '5 days', instructions: 'After meals' },
        { name: 'Paracetamol', strength: '500mg', dosage: '1 tablet', frequency: 'if fever', duration: '3 days', prn: true }
      ],
      [
        { name: 'Cetirizine', strength: '10mg', dosage: '1 tablet', frequency: 'at night', duration: '7 days' }
      ],
      [
        { name: 'Omeprazole', strength: '20mg', dosage: '1 capsule', frequency: 'once daily', duration: '14 days', instructions: 'Before breakfast' }
      ],
      [
        { name: 'Metformin', strength: '500mg', dosage: '1 tablet', frequency: 'twice daily', duration: '30 days', instructions: 'With breakfast and dinner', route: 'Oral' },
        { name: 'Atorvastatin', strength: '10mg', dosage: '1 tablet', frequency: 'at bedtime', duration: '30 days', route: 'Oral' }
      ],
      [
        { name: 'Salbutamol Inhaler', strength: '100mcg', dosage: '2 puffs', frequency: 'as needed', duration: '30 days', instructions: 'Use before exercise or when wheezing', route: 'Inhalation', prn: true }
      ],
      [
        { name: 'Ibuprofen', strength: '400mg', dosage: '1 tablet', frequency: 'twice daily', duration: '7 days', instructions: 'After meals', route: 'Oral' },
        { name: 'Pantoprazole', strength: '40mg', dosage: '1 tablet', frequency: 'once daily', duration: '7 days', instructions: 'Before breakfast', route: 'Oral' }
      ],
      [
        { name: 'Azithromycin', strength: '500mg', dosage: '1 tablet', frequency: 'once daily', duration: '3 days', instructions: 'On empty stomach', route: 'Oral' }
      ],
      [
        { name: 'Amlodipine', strength: '5mg', dosage: '1 tablet', frequency: 'once daily', duration: '30 days', instructions: 'Same time each day', route: 'Oral' },
        { name: 'Losartan', strength: '50mg', dosage: '1 tablet', frequency: 'once daily', duration: '30 days', route: 'Oral' }
      ]
    ];
    
    const prescriptionAdvice = [
      'Hydrate well and rest',
      'Avoid allergens and keep environment clean',
      'Take medications regularly and avoid spicy foods',
      'Monitor blood sugar daily. Follow diabetic diet plan',
      'Avoid triggers like dust, smoke, and cold air',
      'Apply heat and rest the affected area. Avoid strenuous activity',
      'Complete the full course even if symptoms improve',
      'Monitor blood pressure daily. Reduce salt intake and exercise regularly'
    ];

    const recommendedTests = [
      [],
      [],
      ['Blood Sugar Fasting'],
      ['HbA1c', 'Lipid Profile', 'Fasting Blood Sugar'],
      ['Pulmonary Function Test'],
      [],
      [],
      ['ECG', 'Lipid Profile', 'Kidney Function Test']
    ];

    const followUpDays = [14, 7, 30, 30, 14, 7, 7, 30];

    for (let i = 0; i < Math.min(8, createdAppts.length); i++) {
      const appt = createdAppts[i];
      await Prescription.create({
        appointment: appt._id,
        doctor: appt.doctor,
        patient: appt.patient,
        medications: sampleMeds[i],
        advice: prescriptionAdvice[i],
        followUpAfterDays: followUpDays[i],
        nextTests: recommendedTests[i],
        warnings: [],
        createdBy: appt.doctor
      });
    }
    console.log('✅ Sample prescriptions created');

    // Bills
    console.log('💰 Creating bills...');
    const billsData = [
      { appt: createdAppts[0], items: [{ description: 'Cardiology Consultation', qty: 1, unitPrice: 1500, total: 1500 }, { description: 'ECG Test', qty: 1, unitPrice: 800, total: 800 }], status: 'unpaid' },
      { appt: createdAppts[1], items: [{ description: 'Dermatology Consultation', qty: 1, unitPrice: 1200, total: 1200 }, { description: 'Skin Biopsy', qty: 1, unitPrice: 1500, total: 1500 }], status: 'unpaid' },
      { appt: createdAppts[3], items: [{ description: 'Orthopedics Consultation', qty: 1, unitPrice: 1400, total: 1400 }, { description: 'X-Ray', qty: 1, unitPrice: 600, total: 600 }], status: 'paid' },
      { appt: createdAppts[6], items: [{ description: 'Cardiology Follow-up', qty: 1, unitPrice: 1500, total: 1500 }], status: 'paid' },
      { appt: createdAppts[8], items: [{ description: 'Neurology Consultation', qty: 1, unitPrice: 1800, total: 1800 }], status: 'paid' },
      { appt: createdAppts[11], items: [{ description: 'Gynecology Checkup', qty: 1, unitPrice: 1300, total: 1300 }], status: 'paid' }
    ];

    for (const b of billsData) {
      const subtotal = b.items.reduce((sum, item) => sum + item.total, 0);
      const tax = Math.round(subtotal * 0.15); // 15% VAT
      const total = subtotal + tax;
      const bill = await Bill.create({
        appointment: b.appt._id,
        items: b.items,
        subtotal,
        tax,
        total,
        status: b.status,
        provider: 'bKash'
      });
      await Appointment.findByIdAndUpdate(b.appt._id, { bill: bill._id });
    }
    console.log(`✅ ${billsData.length} bills created`);

    // Waiting Queue
    console.log('⏳ Creating waiting queue entries...');
    await WaitingQueue.create({ patient: pat3._id, doctor: doc1._id, requestedDate: now.add(4, 'day').toDate(), flexibleDates: [now.add(5, 'day').toDate()], priority: 'high', notes: 'Emergency consultation needed' });
    await WaitingQueue.create({ patient: pat4._id, doctor: doc5._id, requestedDate: now.add(3, 'day').toDate(), flexibleDates: [], priority: 'medium', notes: 'Child immunization' });
    await WaitingQueue.create({ patient: pat7._id, doctor: doc3._id, requestedDate: now.add(2, 'day').toDate(), flexibleDates: [now.add(3, 'day').toDate()], priority: 'low', notes: 'General checkup' });
    console.log('✅ Queue entries created');

    // Inventory
    console.log('💊 Creating inventory items...');
    const medicines = [
      { name: 'Napa (Paracetamol)', sku: 'MED-NAPA-001', type: 'medicine', quantity: 500, reorderLevel: 100, vendor: 'Square Pharmaceuticals', expiryDate: dayjs().add(24, 'month').toDate() },
      { name: 'Ace (Lisinopril)', sku: 'MED-ACE-002', type: 'medicine', quantity: 300, reorderLevel: 80, vendor: 'Beximco Pharma', expiryDate: dayjs().add(20, 'month').toDate() },
      { name: 'Fexo (Fexofenadine)', sku: 'MED-FEXO-003', type: 'medicine', quantity: 200, reorderLevel: 50, vendor: 'Incepta Pharma', expiryDate: dayjs().add(22, 'month').toDate() },
      { name: 'Insulin Glargine', sku: 'MED-INS-004', type: 'medicine', quantity: 50, reorderLevel: 15, vendor: 'Novo Nordisk Bangladesh', expiryDate: dayjs().add(18, 'month').toDate() },
      { name: 'Amoxicillin', sku: 'MED-AMOX-005', type: 'medicine', quantity: 400, reorderLevel: 100, vendor: 'Square Pharmaceuticals', expiryDate: dayjs().add(15, 'month').toDate() },
      { name: 'Losectil (Omeprazole)', sku: 'MED-LOSE-006', type: 'medicine', quantity: 350, reorderLevel: 90, vendor: 'Renata Limited', expiryDate: dayjs().add(26, 'month').toDate() },
      { name: 'Atorvastatin', sku: 'MED-ATOR-007', type: 'medicine', quantity: 250, reorderLevel: 70, vendor: 'ACI Pharma', expiryDate: dayjs().add(21, 'month').toDate() },
      { name: 'Metformin', sku: 'MED-METF-008', type: 'medicine', quantity: 450, reorderLevel: 120, vendor: 'Beximco Pharma', expiryDate: dayjs().add(19, 'month').toDate() },
      { name: 'Diazepam', sku: 'MED-DIAZ-009', type: 'medicine', quantity: 100, reorderLevel: 30, vendor: 'Drug International', expiryDate: dayjs().add(36, 'month').toDate() },
      { name: 'Saline (0.9% NaCl)', sku: 'MED-SAL-010', type: 'medicine', quantity: 200, reorderLevel: 60, vendor: 'Healthcare Pharmaceuticals', expiryDate: dayjs().add(30, 'month').toDate() },
      { name: 'Syringes (5ml)', sku: 'CON-SYR-011', type: 'consumable', quantity: 1000, reorderLevel: 300, vendor: 'BD Bangladesh', expiryDate: dayjs().add(48, 'month').toDate() },
      { name: 'Surgical Gloves', sku: 'CON-GLV-012', type: 'consumable', quantity: 800, reorderLevel: 200, vendor: 'Top Glove Bangladesh', expiryDate: dayjs().add(36, 'month').toDate() },
      { name: 'Face Masks', sku: 'CON-MSK-013', type: 'consumable', quantity: 2000, reorderLevel: 500, vendor: 'Medicon Pharmaceuticals', expiryDate: dayjs().add(24, 'month').toDate() },
      { name: 'Thermometer (Digital)', sku: 'EQP-THRM-014', type: 'equipment', quantity: 50, reorderLevel: 15, vendor: 'Omron Bangladesh' },
      { name: 'Blood Glucose Strips', sku: 'CON-GLU-015', type: 'consumable', quantity: 300, reorderLevel: 80, vendor: 'Roche Bangladesh', expiryDate: dayjs().add(18, 'month').toDate() }
    ];

    for (const m of medicines) {
      await Inventory.create(m);
    }
    console.log(`✅ ${medicines.length} inventory items created`);

    // Employees
    console.log('👔 Creating employee records...');
    await Employee.create({ user: adminUser._id, department: deptAdmin._id, position: 'Hospital Administrator', salary: 95000, joinDate: dayjs().subtract(5, 'year').toDate(), status: 'active' });
    await Employee.create({ user: hrUser1._id, department: deptAdmin._id, position: 'HR Manager', salary: 62000, joinDate: dayjs().subtract(3, 'year').toDate(), status: 'active' });
    await Employee.create({ user: hrUser2._id, department: deptAdmin._id, position: 'HR Assistant', salary: 38000, joinDate: dayjs().subtract(1, 'year').toDate(), status: 'active' });
    await Employee.create({ user: recUser1._id, department: deptAdmin._id, position: 'Senior Receptionist', salary: 35000, joinDate: dayjs().subtract(4, 'year').toDate(), status: 'active' });
    await Employee.create({ user: recUser2._id, department: deptAdmin._id, position: 'Receptionist', salary: 30500, joinDate: dayjs().subtract(2, 'year').toDate(), status: 'active' });
    await Employee.create({ user: doc1User._id, department: deptCardio._id, position: 'Consultant Cardiologist', salary: 142000, joinDate: dayjs().subtract(12, 'year').toDate(), status: 'active' });
    await Employee.create({ user: doc2User._id, department: deptDerm._id, position: 'Consultant Dermatologist', salary: 130500, joinDate: dayjs().subtract(15, 'year').toDate(), status: 'active' });
    await Employee.create({ user: doc3User._id, department: deptNeuro._id, position: 'Consultant Neurologist', salary: 136200, joinDate: dayjs().subtract(10, 'year').toDate(), status: 'active' });
    await Employee.create({ user: doc4User._id, department: deptOrtho._id, position: 'Consultant Orthopedic Surgeon', salary: 128000, joinDate: dayjs().subtract(8, 'year').toDate(), status: 'active' });
    await Employee.create({ user: doc5User._id, department: deptPeds._id, position: 'Consultant Pediatrician', salary: 118000, joinDate: dayjs().subtract(7, 'year').toDate(), status: 'active' });
    await Employee.create({ user: doc6User._id, department: deptGyne._id, position: 'Consultant Gynecologist', salary: 135000, joinDate: dayjs().subtract(11, 'year').toDate(), status: 'active' });
    console.log('✅ Employee records created');

    // Leave Requests
    console.log('🏖️ Creating leave requests...');
    await LeaveRequest.create({ user: recUser1._id, startDate: dayjs().add(10, 'day').toDate(), endDate: dayjs().add(12, 'day').toDate(), reason: 'Family wedding in Sylhet', status: 'pending' });
    await LeaveRequest.create({ user: doc3User._id, startDate: dayjs().subtract(5, 'day').toDate(), endDate: dayjs().subtract(3, 'day').toDate(), reason: 'Medical conference', status: 'approved', approver: adminUser._id, decidedAt: dayjs().subtract(10, 'day').toDate() });
    await LeaveRequest.create({ user: hrUser2._id, startDate: dayjs().add(15, 'day').toDate(), endDate: dayjs().add(17, 'day').toDate(), reason: 'Personal matter', status: 'pending' });
    await LeaveRequest.create({ user: doc5User._id, startDate: dayjs().subtract(2, 'day').toDate(), endDate: dayjs().subtract(1, 'day').toDate(), reason: 'Sick leave', status: 'approved', approver: hrUser1._id, decidedAt: dayjs().subtract(3, 'day').toDate() });
    await LeaveRequest.create({ user: recUser2._id, startDate: dayjs().add(20, 'day').toDate(), endDate: dayjs().add(22, 'day').toDate(), reason: 'Eid vacation', status: 'pending' });
    console.log('✅ Leave requests created');

    // Payroll
    console.log('💵 Creating payroll records...');
    const currentMonth = now.format('YYYY-MM');
    const lastMonth = now.subtract(1, 'month').format('YYYY-MM');
    
    await Payroll.create({ user: adminUser._id, month: currentMonth, baseSalary: 80000, allowances: 20000, deductions: 5000, netPay: 95000, status: 'unpaid' });
    await Payroll.create({ user: hrUser1._id, month: currentMonth, baseSalary: 55000, allowances: 10000, deductions: 3000, netPay: 62000, status: 'unpaid' });
    await Payroll.create({ user: hrUser2._id, month: currentMonth, baseSalary: 35000, allowances: 5000, deductions: 2000, netPay: 38000, status: 'unpaid' });
    await Payroll.create({ user: recUser1._id, month: currentMonth, baseSalary: 32000, allowances: 5000, deductions: 2000, netPay: 35000, status: 'unpaid' });
    await Payroll.create({ user: recUser2._id, month: currentMonth, baseSalary: 28000, allowances: 4000, deductions: 1500, netPay: 30500, status: 'unpaid' });
    await Payroll.create({ user: doc1User._id, month: currentMonth, baseSalary: 120000, allowances: 30000, deductions: 8000, netPay: 142000, status: 'unpaid' });
    await Payroll.create({ user: doc2User._id, month: currentMonth, baseSalary: 110000, allowances: 28000, deductions: 7500, netPay: 130500, status: 'unpaid' });
    await Payroll.create({ user: doc3User._id, month: currentMonth, baseSalary: 115000, allowances: 29000, deductions: 7800, netPay: 136200, status: 'unpaid' });
    
    // Last month (paid)
    await Payroll.create({ user: adminUser._id, month: lastMonth, baseSalary: 80000, allowances: 20000, deductions: 5000, netPay: 95000, status: 'paid', paidAt: now.subtract(5, 'day').toDate() });
    await Payroll.create({ user: doc1User._id, month: lastMonth, baseSalary: 120000, allowances: 30000, deductions: 8000, netPay: 142000, status: 'paid', paidAt: now.subtract(5, 'day').toDate() });
    await Payroll.create({ user: recUser1._id, month: lastMonth, baseSalary: 32000, allowances: 5000, deductions: 2000, netPay: 35000, status: 'paid', paidAt: now.subtract(5, 'day').toDate() });
    console.log('✅ Payroll records created');

    // Notifications
    console.log('🔔 Creating notifications...');
    await Notification.create({ user: pat1User._id, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Nami on ' + now.format('MMM DD') + ' at 10:00 AM has been confirmed.', read: false });
    await Notification.create({ user: pat2User._id, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Tsunade Senju on ' + now.format('MMM DD') + ' at 2:00 PM has been confirmed.', read: false });
    await Notification.create({ user: doc1User._id, title: 'New Patient Appointment', message: 'New appointment scheduled with Chitoge Kirisaki for ' + now.format('MMM DD') + ' at 10:00 AM', read: true });
    await Notification.create({ user: recUser1._id, title: 'Leave Request Pending', message: 'Your leave request for family wedding is pending approval.', read: false });
    await Notification.create({ user: adminUser._id, title: 'Low Inventory Alert', message: 'Insulin Glargine stock is running low. Current: 50 vials, Reorder level: 15', read: false });
    await Notification.create({ user: pat5User._id, title: 'Appointment Reminder', message: 'Reminder: Your appointment with Dr. Rukia Kuchiki is scheduled for today at 4:00 PM', read: false });
    await Notification.create({ user: hrUser1._id, title: 'Leave Approval Required', message: '2 new leave requests require your approval.', read: false });
    console.log('✅ Notifications created');

    console.log('\n🎉 Seed complete! Database populated with comprehensive Bangladesh-centered data.');
    console.log('📧 Login credentials:');
    console.log('  Admin: admin@hms.bd / Admin@123');
    console.log('  HR: hr@hms.bd / Pass@123');
    console.log('  Reception: reception@hms.bd / Pass@123');
    console.log('  Doctor: dr.nami@hms.bd / Pass@123');
    console.log('  Patient: chitoge@example.bd / Pass@123');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
  }
};

run();
