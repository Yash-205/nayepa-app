import mongoose, { Schema } from 'mongoose';

const DonorSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    lastDonationDate: { type: Date, required: true },
    donationFrequency: { type: Number, required: true }, // In months
    totalDonated: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Donor = mongoose.models.Donor || mongoose.model('Donor', DonorSchema);
export default Donor;
