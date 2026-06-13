import mongoose, { Schema } from 'mongoose';

const CampaignSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Draft'],
      default: 'Draft',
    },
    date: { type: Date, required: true },
    requiredSkills: [{ type: String }],
  },
  { timestamps: true }
);

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
export default Campaign;
