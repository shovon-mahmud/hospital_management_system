import mongoose from 'mongoose';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import Role from '../src/models/Role.js';
import User from '../src/models/User.js';
import Patient from '../src/models/Patient.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import Bill from '../src/models/Bill.js';
import Department from '../src/models/Department.js';
import Inventory from '../src/models/Inventory.js';
import Notification from '../src/models/Notification.js';
import Log from '../src/models/Log.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hms_copilot';

// Generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate future date
const futureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
};

const seedData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Role.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Bill.deleteMany({});
    await Department.deleteMany({});
    await Inventory.deleteMany({});
    await Notification.deleteMany({});
    await Log.deleteMany({});
    console.log('✅ Existing data cleared');

    // ==================== ROLES ====================
    console.log('📝 Creating roles...');
    const roles = await Role.create([
      { name: 'Admin', description: 'System administrator with full access' },
      { name: 'Doctor', description: 'Medical professional' },
      { name: 'Patient', description: 'Patient user' },
      { name: 'Receptionist', description: 'Front desk and appointment management' },
      { name: 'HR', description: 'Human resources management' }
    ]);
    const [adminRole, doctorRole, patientRole, receptionistRole, hrRole] = roles;
    console.log(`✅ Created ${roles.length} roles`);

    // ==================== USERS ====================
    console.log('👥 Creating users...');
    
    // Admin Users (2)
    const adminUsers = await User.create([
      {
        name: 'Admin User',
        email: 'admin@hms.local',
        password: 'Admin@123',
        role: adminRole._id,
        emailVerified: true
      },
      {
        name: 'Super Admin',
        email: 'superadmin@hms.local',
        password: 'Admin@123',
        role: adminRole._id,
        emailVerified: true
      }
    ]);

    // Receptionist Users (3)
    const receptionistUsers = await User.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah.reception@hms.local',
        password: 'Reception@123',
        role: receptionistRole._id,
        emailVerified: true
      },
      {
        name: 'Mike Thompson',
        email: 'mike.reception@hms.local',
        password: 'Reception@123',
        role: receptionistRole._id,
        emailVerified: true
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.reception@hms.local',
        password: 'Reception@123',
        role: receptionistRole._id,
        emailVerified: true
      }
    ]);

    // HR Users (2)
    const hrUsers = await User.create([
      {
        name: 'David Miller',
        email: 'david.hr@hms.local',
        password: 'HR@123',
        role: hrRole._id,
        emailVerified: true
      },
      {
        name: 'Emily Brown',
        email: 'emily.hr@hms.local',
        password: 'HR@123',
        role: hrRole._id,
        emailVerified: true
      }
    ]);

    // Doctor Users (10)
    const doctorUsers = await User.create([
      { name: 'Dr. John Smith', email: 'john.smith@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Emily Davis', email: 'emily.davis@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Michael Johnson', email: 'michael.johnson@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Sarah Wilson', email: 'sarah.wilson@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. David Lee', email: 'david.lee@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Jennifer Martinez', email: 'jennifer.martinez@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Robert Taylor', email: 'robert.taylor@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Lisa Anderson', email: 'lisa.anderson@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. James White', email: 'james.white@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true },
      { name: 'Dr. Maria Garcia', email: 'maria.garcia@hms.local', password: 'Doctor@123', role: doctorRole._id, emailVerified: true }
    ]);

    // Patient Users (15)
    const patientUsers = await User.create([
      { name: 'Alice Thompson', email: 'alice.thompson@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Bob Williams', email: 'bob.williams@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Carol Martinez', email: 'carol.martinez@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Daniel Brown', email: 'daniel.brown@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Eva Rodriguez', email: 'eva.rodriguez@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Frank Miller', email: 'frank.miller@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Grace Lee', email: 'grace.lee@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Henry Wilson', email: 'henry.wilson@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Irene Davis', email: 'irene.davis@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Jack Taylor', email: 'jack.taylor@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Karen Anderson', email: 'karen.anderson@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Leo Martinez', email: 'leo.martinez@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Monica Garcia', email: 'monica.garcia@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Nathan White', email: 'nathan.white@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true },
      { name: 'Olivia Johnson', email: 'olivia.johnson@email.com', password: 'Patient@123', role: patientRole._id, emailVerified: true }
    ]);

    console.log(`✅ Created ${adminUsers.length + receptionistUsers.length + hrUsers.length + doctorUsers.length + patientUsers.length} users`);

    // ==================== DEPARTMENTS ====================
    console.log('🏥 Creating departments...');
    const departments = await Department.create([
      { name: 'Cardiology', description: 'Heart and cardiovascular system care' },
      { name: 'Neurology', description: 'Brain and nervous system disorders' },
      { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents' },
      { name: 'Orthopedics', description: 'Musculoskeletal system treatment' },
      { name: 'Dermatology', description: 'Skin, hair, and nail conditions' },
      { name: 'Oncology', description: 'Cancer treatment and care' },
      { name: 'Radiology', description: 'Medical imaging and diagnostics' },
      { name: 'Emergency', description: 'Emergency medical services' },
      { name: 'Surgery', description: 'Surgical procedures and operations' },
      { name: 'Psychiatry', description: 'Mental health and behavioral disorders' },
      { name: 'Gynecology', description: 'Women\'s reproductive health' },
      { name: 'Endocrinology', description: 'Hormone and metabolic disorders' }
    ]);
    console.log(`✅ Created ${departments.length} departments`);

    // ==================== DOCTORS ====================
    console.log('👨‍⚕️ Creating doctor profiles...');
    const specializations = [
      'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology',
      'Oncology', 'Radiology', 'Emergency Medicine', 'General Surgery', 'Psychiatry'
    ];
    
    const deptByName = Object.fromEntries(departments.map(d => [d.name, d]));
    const doctors = await Doctor.create(
      doctorUsers.map((user, index) => ({
        user: user._id,
        specialization: specializations[index],
        experienceYears: 5 + Math.floor(Math.random() * 20),
        availability: [
          { day: 'Mon', slots: [{ start: '09:00', end: '17:00' }] },
          { day: 'Wed', slots: [{ start: '09:00', end: '17:00' }] },
          { day: 'Fri', slots: [{ start: '09:00', end: '17:00' }] }
        ],
        qualifications: index % 2 === 0 ? ['MBBS','MD'] : ['MBBS'],
        languages: index % 3 === 0 ? ['English','Spanish'] : ['English'],
        bio: `Experienced ${specializations[index]} specialist with focus on patient-centered care.`,
        department: (deptByName[specializations[index]] || deptByName['Emergency'])?._id,
        consultationFee: 50 + Math.floor(Math.random() * 150)
      }))
    );
    console.log(`✅ Created ${doctors.length} doctor profiles`);

    // ==================== PATIENTS ====================
    console.log('🧑‍🦱 Creating patient profiles...');
    const patients = [];
    const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    const genders = ['Male','Female','Other'];
    for (let index = 0; index < patientUsers.length; index++) {
      const patient = await Patient.create({
        user: patientUsers[index]._id,
        patientId: `P-${Date.now()}${index.toString().padStart(3, '0')}`,
        gender: genders[index % genders.length],
        dateOfBirth: randomDate(new Date(1960,0,1), new Date(2010,0,1)),
        bloodGroup: bloodGroups[index % bloodGroups.length],
        heightCm: 150 + Math.floor(Math.random() * 40),
        weightKg: 50 + Math.floor(Math.random() * 40),
        contact: {
          phone: `555-0${(100 + index).toString().slice(-3)}-${Math.floor(Math.random() * 9000) + 1000}`,
          address: `${100 + index} Main Street, City, State ${10000 + index}`,
          emergencyContact: `555-0${(200 + index).toString().slice(-3)}-${Math.floor(Math.random() * 9000) + 1000}`
        },
        insurance: {
          provider: index % 2 === 0 ? 'BlueShield' : 'MediPlus',
          number: `INS-${100000 + index}`
        },
        medical: {
          history: index % 3 === 0 ? ['Hypertension', 'Diabetes Type 2'] : index % 2 === 0 ? ['Asthma'] : [],
          allergies: index % 4 === 0 ? ['Penicillin', 'Peanuts'] : index % 3 === 0 ? ['Latex'] : [],
          prescriptions: index % 2 === 0 ? ['Metformin 500mg', 'Lisinopril 10mg'] : []
        },
        notes: index % 2 === 0 ? 'Requires regular follow-up.' : '—'
      });
      patients.push(patient);
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    console.log(`✅ Created ${patients.length} patient profiles`);

    // ==================== APPOINTMENTS ====================
    console.log('📅 Creating appointments...');
    const appointments = [];

    // Past appointments (10)
    for (let i = 0; i < 10; i++) {
      appointments.push({
        patient: patients[i % patients.length]._id,
        doctor: doctors[i % doctors.length]._id,
        appointmentDate: randomDate(new Date(2025, 9, 1), new Date(2025, 10, 3)),
        status: i % 3 === 0 ? 'completed' : 'canceled',
        notes: `Follow-up appointment for patient ${i + 1}`
      });
    }

    // Today's appointments (5)
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const hour = 9 + i * 2;
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0);
      appointments.push({
        patient: patients[(10 + i) % patients.length]._id,
        doctor: doctors[i % doctors.length]._id,
        appointmentDate: todayDate,
        status: i % 2 === 0 ? 'confirmed' : 'pending',
        notes: `Today's appointment ${i + 1}`
      });
    }

    // Future appointments (15)
    for (let i = 0; i < 15; i++) {
      const daysAhead = 1 + Math.floor(Math.random() * 14);
      const hour = 9 + Math.floor(Math.random() * 8);
      appointments.push({
        patient: patients[i % patients.length]._id,
        doctor: doctors[i % doctors.length]._id,
        appointmentDate: futureDate(daysAhead).setHours(hour, 0, 0, 0),
        status: i % 4 === 0 ? 'confirmed' : 'pending',
        notes: `Scheduled appointment for ${patients[i % patients.length].contact.phone}`
      });
    }

    const createdAppointments = await Appointment.create(appointments);
    console.log(`✅ Created ${createdAppointments.length} appointments`);

    // ==================== BILLS ====================
    console.log('💰 Creating bills...');
    const completedAppointments = createdAppointments.filter(a => a.status === 'completed');
    const bills = await Bill.create(
      completedAppointments.map((appt, index) => {
        const items = [
          { name: 'Consultation Fee', qty: 1, unitPrice: 150 },
          { name: 'Lab Tests', qty: index % 3 + 1, unitPrice: 50 }
        ];
        const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
        const tax = parseFloat((subtotal * 0.1).toFixed(2));
        return {
          appointment: appt._id,
          items,
          subtotal,
          tax,
          total: subtotal + tax,
          status: index % 3 === 0 ? 'paid' : 'unpaid',
          provider: 'stripe',
          transactionId: index % 3 === 0 ? `txn_${Date.now()}${index}` : null
        };
      })
    );

    // Update appointments with bill references
    for (let i = 0; i < bills.length; i++) {
      await Appointment.findByIdAndUpdate(completedAppointments[i]._id, { bill: bills[i]._id });
    }
    console.log(`✅ Created ${bills.length} bills`);

    // ==================== INVENTORY ====================
    console.log('📦 Creating inventory items...');
    const inventoryItems = await Inventory.create([
      { name: 'Paracetamol 500mg', sku: 'MED-001', type: 'medicine', quantity: 500, reorderLevel: 100, vendor: 'PharmaCorp' },
      { name: 'Amoxicillin 250mg', sku: 'MED-002', type: 'medicine', quantity: 300, reorderLevel: 50, vendor: 'PharmaCorp' },
      { name: 'Ibuprofen 400mg', sku: 'MED-003', type: 'medicine', quantity: 400, reorderLevel: 80, vendor: 'MediSupply' },
      { name: 'Insulin Syringes', sku: 'MED-004', type: 'consumable', quantity: 1000, reorderLevel: 200, vendor: 'MedEquip' },
      { name: 'Blood Pressure Monitor', sku: 'EQP-001', type: 'equipment', quantity: 15, reorderLevel: 3, vendor: 'HealthTech' },
      { name: 'Stethoscope', sku: 'EQP-002', type: 'equipment', quantity: 25, reorderLevel: 5, vendor: 'HealthTech' },
      { name: 'Surgical Gloves (Box)', sku: 'CON-001', type: 'consumable', quantity: 200, reorderLevel: 50, vendor: 'SafeMed' },
      { name: 'Face Masks (Box)', sku: 'CON-002', type: 'consumable', quantity: 500, reorderLevel: 100, vendor: 'SafeMed' },
      { name: 'Antibacterial Soap', sku: 'CON-003', type: 'consumable', quantity: 150, reorderLevel: 30, vendor: 'CleanCare' },
      { name: 'Digital Thermometer', sku: 'EQP-003', type: 'equipment', quantity: 30, reorderLevel: 5, vendor: 'HealthTech' },
      { name: 'Aspirin 100mg', sku: 'MED-005', type: 'medicine', quantity: 600, reorderLevel: 120, vendor: 'PharmaCorp' },
      { name: 'Bandages (Pack)', sku: 'CON-004', type: 'consumable', quantity: 250, reorderLevel: 50, vendor: 'SafeMed' },
      { name: 'Oxygen Mask', sku: 'EQP-004', type: 'equipment', quantity: 40, reorderLevel: 10, vendor: 'MedEquip' },
      { name: 'ECG Machine', sku: 'EQP-005', type: 'equipment', quantity: 5, reorderLevel: 1, vendor: 'HealthTech' },
      { name: 'Wheelchair', sku: 'EQP-006', type: 'equipment', quantity: 12, reorderLevel: 3, vendor: 'MedEquip' }
    ]);
    console.log(`✅ Created ${inventoryItems.length} inventory items`);

    // ==================== NOTIFICATIONS ====================
    console.log('🔔 Creating notifications...');
    const notifications = [];
    
    // Admin notifications
    for (let i = 0; i < 3; i++) {
      notifications.push({
        user: adminUsers[0]._id,
        type: 'system',
        title: 'System Update',
        message: `System maintenance scheduled for ${new Date(Date.now() + i * 86400000).toLocaleDateString()}`,
        read: i === 0
      });
    }

    // Doctor notifications
    for (let i = 0; i < 5; i++) {
      notifications.push({
        user: doctorUsers[i]._id,
        type: 'appointment',
        title: 'New Appointment',
        message: `You have a new appointment scheduled`,
        read: false
      });
    }

    // Patient notifications
    for (let i = 0; i < 10; i++) {
      notifications.push({
        user: patientUsers[i]._id,
        type: 'appointment',
        title: 'Appointment Reminder',
        message: `Your appointment is coming up soon`,
        read: i % 3 === 0
      });
    }

    // Receptionist notifications
    for (let i = 0; i < 3; i++) {
      notifications.push({
        user: receptionistUsers[i]._id,
        type: 'info',
        title: 'Pending Check-ins',
        message: `You have ${3 + i} pending check-ins today`,
        read: false
      });
    }

    const createdNotifications = await Notification.create(notifications);
    console.log(`✅ Created ${createdNotifications.length} notifications`);

    // ==================== LOGS ====================
    console.log('📝 Creating system logs...');
    const logActions = ['created', 'updated', 'deleted', 'login', 'logout'];
    const logEntities = ['user', 'patient', 'doctor', 'appointment', 'bill'];
    const logs = [];

    for (let i = 0; i < 30; i++) {
      logs.push({
        user: i % 2 === 0 ? adminUsers[0]._id : receptionistUsers[i % receptionistUsers.length]._id,
        action: logActions[i % logActions.length],
        entity: logEntities[i % logEntities.length],
        entityId: createdAppointments[i % createdAppointments.length]._id,
        meta: { message: `Log entry ${i + 1}` },
        ip: `192.168.1.${100 + i}`
      });
    }

    const createdLogs = await Log.create(logs);
    console.log(`✅ Created ${createdLogs.length} system logs`);

    // ==================== SUMMARY ====================
    console.log('\n🎉 ========== SEED DATA SUMMARY ==========');
    console.log(`📊 Roles: ${roles.length}`);
    console.log(`👥 Users: ${adminUsers.length + receptionistUsers.length + hrUsers.length + doctorUsers.length + patientUsers.length}`);
    console.log(`   - Admins: ${adminUsers.length}`);
    console.log(`   - Receptionists: ${receptionistUsers.length}`);
    console.log(`   - HR Staff: ${hrUsers.length}`);
    console.log(`   - Doctors: ${doctorUsers.length}`);
    console.log(`   - Patients: ${patientUsers.length}`);
    console.log(`🏥 Departments: ${departments.length}`);
    console.log(`👨‍⚕️ Doctor Profiles: ${doctors.length}`);
    console.log(`🧑‍🦱 Patient Profiles: ${patients.length}`);
    console.log(`📅 Appointments: ${createdAppointments.length}`);
    console.log(`   - Completed: ${createdAppointments.filter(a => a.status === 'completed').length}`);
    console.log(`   - Confirmed: ${createdAppointments.filter(a => a.status === 'confirmed').length}`);
    console.log(`   - Pending: ${createdAppointments.filter(a => a.status === 'pending').length}`);
    console.log(`   - Canceled: ${createdAppointments.filter(a => a.status === 'canceled').length}`);
    console.log(`💰 Bills: ${bills.length}`);
    console.log(`📦 Inventory Items: ${inventoryItems.length}`);
    console.log(`🔔 Notifications: ${createdNotifications.length}`);
    console.log(`📝 System Logs: ${createdLogs.length}`);
    console.log('==========================================\n');

    console.log('🔐 ========== LOGIN CREDENTIALS ==========');
    console.log('Admin:');
    console.log('  Email: admin@hms.local');
    console.log('  Password: Admin@123\n');
    console.log('Doctor (Sample):');
    console.log('  Email: john.smith@hms.local');
    console.log('  Password: Doctor@123\n');
    console.log('Receptionist (Sample):');
    console.log('  Email: sarah.reception@hms.local');
    console.log('  Password: Reception@123\n');
    console.log('Patient (Sample):');
    console.log('  Email: alice.thompson@email.com');
    console.log('  Password: Patient@123\n');
    console.log('HR (Sample):');
    console.log('  Email: david.hr@hms.local');
    console.log('  Password: HR@123\n');
    console.log('==========================================\n');

    console.log('✅ All seed data successfully created and pushed to MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();



