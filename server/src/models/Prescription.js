import mongoose from 'mongoose';

// Each prescription consists of one or more medication items
// Embedded for atomic updates; historical immutability favored (avoid cascading changes)
const medicationSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },            // e.g. "Amoxicillin"
	form: { type: String, trim: true },                            // e.g. tablet, syrup
	strength: { type: String, trim: true },                        // e.g. 500mg
	dosage: { type: String, required: true, trim: true },          // e.g. "1 tablet"
	frequency: { type: String, required: true, trim: true },       // e.g. "twice daily"
	route: { type: String, trim: true },                           // e.g. oral, topical
	duration: { type: String, required: true, trim: true },        // e.g. "5 days"
	instructions: { type: String, trim: true },                    // e.g. "After meals"
	prn: { type: Boolean, default: false },                        // as needed flag
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
	appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
	patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
	doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
	medications: { type: [medicationSchema], validate: v => v.length > 0 },
	advice: { type: String, trim: true },                          // General physician advice
	followUpAfterDays: { type: Number, min: 0 },                   // Suggest follow-up window
	nextTests: { type: [String], default: [] },                    // Lab tests recommended
	warnings: { type: [String], default: [] },                     // e.g. allergy or contraindication notes
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usually doctor user
	printableCode: { type: String, unique: true },                 // Short code / slug for quick reference
	isArchived: { type: Boolean, default: false },
}, { timestamps: true });

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ appointment: 1 }); // Allow multiple prescriptions per appointment

export default mongoose.model('Prescription', prescriptionSchema);

