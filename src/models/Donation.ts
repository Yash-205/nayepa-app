import mongoose, { Schema } from 'mongoose';

const DonationSchema = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    campaignCategory: { type: String, required: true }, // e.g. Education, Hygiene, Animal Welfare
  },
  { timestamps: true }
);

const Donation = mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
export default Donation;
