import mongoose, { Schema } from 'mongoose';

const VolunteerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    availability: { type: Number, default: 0 }, // Hours per week
    skills: [{ type: String }],
    screeningNotes: { type: String, default: '' },
    targetDomain: { type: String, default: '' }, // e.g., Education, Hygiene, Animal Welfare
    chatHistory: [
      {
        sessionId: { type: String, default: 'legacy_session' },
        role: { type: String, enum: ['user', 'model'], required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    chatSessions: [
      {
        sessionId: { type: String, required: true },
        title: { type: String, default: 'New Conversation' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent Mongoose from caching the old schema during Next.js Hot-Module Reloading
if (mongoose.models.Volunteer) {
  delete mongoose.models.Volunteer;
}

const Volunteer = mongoose.model('Volunteer', VolunteerSchema);
export default Volunteer;
