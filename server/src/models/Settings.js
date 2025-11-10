import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  // General Settings
  general: {
    hospitalName: { type: String, default: 'Hospital Management System' },
    hospitalAddress: { type: String, default: '' },
    hospitalPhone: { type: String, default: '' },
    hospitalEmail: { type: String, default: '' },
    hospitalLogo: { type: String, default: '' }, // URL or base64
    website: { type: String, default: '' },
    timeZone: { type: String, default: 'Asia/Dhaka' },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'BDT' },
    currencySymbol: { type: String, default: '৳' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeFormat: { type: String, default: '12h' },
    workingHours: {
      monday: { start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
      tuesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
      wednesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
      thursday: { start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
      friday: { start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
      saturday: { start: { type: String, default: '09:00' }, end: { type: String, default: '14:00' }, closed: { type: Boolean, default: false } },
      sunday: { start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' }, closed: { type: Boolean, default: true } }
    },
    emergencyContact: { type: String, default: '' },
    ambulanceContact: { type: String, default: '' },
    taxId: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    doctorSignature: { type: String, default: '' } // base64 image or URL for prescription PDFs
  },

  // SMTP/Email Settings
  email: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpSecure: { type: Boolean, default: false }, // true for 465, false for other ports
    smtpTLS: { type: Boolean, default: true },
    fromEmail: { type: String, default: '' },
    fromName: { type: String, default: 'HMS System' },
    replyToEmail: { type: String, default: '' },
    connectionTimeout: { type: Number, default: 30000 }, // milliseconds
    greetingTimeout: { type: Number, default: 30000 },
    socketTimeout: { type: Number, default: 60000 },
    maxConnections: { type: Number, default: 5 },
    maxMessages: { type: Number, default: 100 }, // per connection
    rateDelta: { type: Number, default: 1000 }, // time window in ms
    rateLimit: { type: Number, default: 5 }, // max messages in time window
    enableDKIM: { type: Boolean, default: false },
    dkimDomain: { type: String, default: '' },
    dkimKeySelector: { type: String, default: '' },
    dkimPrivateKey: { type: String, default: '' },
    enableNotifications: { type: Boolean, default: true },
    sendAppointmentConfirmations: { type: Boolean, default: true },
    sendAppointmentReminders: { type: Boolean, default: true },
    reminderHoursBefore: { type: Number, default: 24 }
  },

  // System Settings
  system: {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is under maintenance. Please check back later.' },
    allowRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 60 }, // minutes
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 15 }, // minutes
    passwordMinLength: { type: Number, default: 8 },
    passwordRequireUppercase: { type: Boolean, default: true },
    passwordRequireNumbers: { type: Boolean, default: true },
    passwordRequireSpecialChars: { type: Boolean, default: true },
    enableTwoFactor: { type: Boolean, default: false },
    backupFrequency: { type: String, default: 'daily' }, // daily, weekly, monthly
    backupRetention: { type: Number, default: 30 }, // days
    enableAuditLog: { type: Boolean, default: true },
    logRetention: { type: Number, default: 90 }, // days
    enableRateLimiting: { type: Boolean, default: true },
    apiRateLimit: { type: Number, default: 100 }, // requests per minute
    uploadMaxSize: { type: Number, default: 5 }, // MB
    allowedFileTypes: { type: [String], default: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'] }
  },

  // Notification Settings
  notifications: {
    enableEmailNotifications: { type: Boolean, default: true },
    enableSMSNotifications: { type: Boolean, default: false },
    enablePushNotifications: { type: Boolean, default: true },
    notifyOnNewAppointment: { type: Boolean, default: true },
    notifyOnAppointmentCancellation: { type: Boolean, default: true },
    notifyOnBillGeneration: { type: Boolean, default: true },
    notifyOnPaymentReceived: { type: Boolean, default: true }
  },

  // Last updated info
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure only one settings document exists (singleton pattern)
SettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('Settings', SettingsSchema);
