import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

async function verifySeed() {
  try {
    await connectDB();
    console.log('MongoDB connected');
    
    const db = mongoose.connection.db;
    
    console.log('\n📊 Database Statistics:');
    console.log('Users:', await db.collection('users').countDocuments());
    console.log('Patients:', await db.collection('patients').countDocuments());
    console.log('Doctors:', await db.collection('doctors').countDocuments());
    console.log('Employees:', await db.collection('employees').countDocuments());
    console.log('Appointments:', await db.collection('appointments').countDocuments());
    console.log('Bills:', await db.collection('bills').countDocuments());
    console.log('Inventory:', await db.collection('inventories').countDocuments());
    console.log('Payroll:', await db.collection('payrolls').countDocuments());
    console.log('Leaves:', await db.collection('leaves').countDocuments());
    
    const employee = await db.collection('employees').findOne({}, { 
      projection: { position: 1, salary: 1, status: 1 } 
    });
    console.log('\n✅ Sample Employee:', JSON.stringify(employee, null, 2));
    
    const patient = await db.collection('patients').findOne({}, { 
      projection: { dateOfBirth: 1, bloodGroup: 1, heightCm: 1, weightKg: 1 } 
    });
    console.log('\n✅ Sample Patient:', JSON.stringify(patient, null, 2));
    
      const inventory = await db.collection('inventories').findOne({ type: 'medicine' }, { 
      projection: { name: 1, expiryDate: 1, type: 1 } 
    });
    console.log('\n✅ Sample Medicine:', JSON.stringify(inventory, null, 2));
    
      // Check all employees have position and salary
      const employeesCheck = await db.collection('employees').find({}, {
        projection: { position: 1, salary: 1, status: 1 }
      }).toArray();
      console.log(`\n✅ All ${employeesCheck.length} employees have position and salary fields:`, 
        employeesCheck.every(e => e.position && e.salary !== undefined && e.status));
    
    // Check payroll records
    const payroll = await db.collection('payrolls').findOne({}, {
      projection: { month: 1, baseSalary: 1, allowances: 1, netPay: 1, status: 1 }
    });
    console.log('\n✅ Sample Payroll:', JSON.stringify(payroll, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifySeed();
