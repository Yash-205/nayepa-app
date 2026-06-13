import mongoose, { Schema } from 'mongoose';

const CampaignLogSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    rawNotes: { type: String, required: true },
    generatedCopy: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      newsletter: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const CampaignLog = mongoose.models.CampaignLog || mongoose.model('CampaignLog', CampaignLogSchema);
export default CampaignLog;
