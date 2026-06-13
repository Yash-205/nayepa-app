const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Manual .env.local loader
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
    console.log('Loaded .env.local configuration file successfully.');
  }
} catch (err) {
  console.log('No .env.local file loaded, using process.env or fallback defaults.');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nayepa';

// Define Schemas directly in JS to bypass TS compilation at script runtime
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Coordinator', 'Volunteer'], default: 'Volunteer' }
}, { timestamps: true });

const VolunteerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  availability: { type: Number, default: 0 },
  skills: [{ type: String }],
  screeningNotes: { type: String, default: '' },
  targetDomain: { type: String, default: '' },
  chatHistory: [
    {
      sessionId: { type: String, required: true },
      role: { type: String, enum: ['user', 'model'], required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  chatSessions: [
    {
      sessionId: { type: String, required: true },
      title: { type: String, default: 'New Conversation' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  onboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Completed', 'Draft'], default: 'Draft' },
  date: { type: Date, required: true },
  requiredSkills: [{ type: String }]
}, { timestamps: true });

const DonorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  lastDonationDate: { type: Date, required: true },
  donationFrequency: { type: Number, required: true },
  totalDonated: { type: Number, required: true, default: 0 }
}, { timestamps: true });

const DonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  campaignCategory: { type: String, required: true }
}, { timestamps: true });

const CampaignLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  rawNotes: { type: String, required: true },
  generatedCopy: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    newsletter: { type: String, default: '' }
  }
}, { timestamps: true });

const AgentCheckpointSchema = new mongoose.Schema({
  threadId: { type: String, required: true, index: true },
  checkpointId: { type: String, required: true },
  parentCheckpointId: { type: String },
  checkpoint: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Volunteer = mongoose.models.Volunteer || mongoose.model('Volunteer', VolunteerSchema);
const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
const Donor = mongoose.models.Donor || mongoose.model('Donor', DonorSchema);
const Donation = mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
const CampaignLog = mongoose.models.CampaignLog || mongoose.model('CampaignLog', CampaignLogSchema);
const AgentCheckpoint = mongoose.models.AgentCheckpoint || mongoose.model('AgentCheckpoint', AgentCheckpointSchema);

async function seed() {
  console.log('Connecting to database:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Database connected successfully.');

  // Clean collections
  console.log('Cleaning existing records...');
  await User.deleteMany({});
  await Volunteer.deleteMany({});
  await Campaign.deleteMany({});
  await Donor.deleteMany({});
  await Donation.deleteMany({});
  await CampaignLog.deleteMany({});
  await AgentCheckpoint.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('Password123', salt);

  console.log('Creating users...');
  const users = await User.create([
    { name: 'Aarav Singhania', email: 'aarav.admin@nayepankh.org', password: commonPassword, role: 'Admin' },
    { name: 'Zara Qureshi', email: 'zara.coord@nayepankh.org', password: commonPassword, role: 'Coordinator' },
    { name: 'Rohan Chatterjee', email: 'rohan.vol@gmail.com', password: commonPassword, role: 'Volunteer' },
    { name: 'Kavya Menon', email: 'kavya.vol@gmail.com', password: commonPassword, role: 'Volunteer' },
    { name: 'Siddharth Rao', email: 'siddharth.vol@gmail.com', password: commonPassword, role: 'Volunteer' }
  ]);

  console.log('Creating volunteer profiles...');
  const volunteer1 = await Volunteer.create({
    userId: users[2]._id,
    phone: '+919876543210',
    location: 'Delhi',
    availability: 8,
    skills: ['Teaching', 'Public Speaking'],
    screeningNotes: 'Rohan is highly enthusiastic about teaching underprivileged children. He has prior volunteering experience with local tutoring cells.',
    targetDomain: 'Education',
    onboardingComplete: true
  });

  const volunteer2 = await Volunteer.create({
    userId: users[3]._id,
    phone: '+919876543211',
    location: 'Mumbai',
    availability: 6,
    skills: ['Event Management', 'Public Speaking'],
    screeningNotes: 'Kavya has strong communication skills and event organization experience. Eager to support awareness drives.',
    targetDomain: 'Hygiene',
    onboardingComplete: true
  });

  // Onboarding in-progress volunteer
  const volunteer3 = await Volunteer.create({
    userId: users[4]._id,
    phone: '+919876543212',
    location: 'Kanpur',
    availability: 4,
    skills: ['Animal Rescue'],
    screeningNotes: 'Screening in progress. Candidate expressed strong passion for stray animal feeding and rescue operations.',
    targetDomain: 'Animal Welfare',
    chatSessions: [
      { sessionId: 'siddharth_session_1', title: 'Onboarding Chat' }
    ],
    chatHistory: [
      { sessionId: 'siddharth_session_1', role: 'model', text: 'Hello Siddharth! Welcome to NayePankh Foundation. I am your onboarding AI screening coordinator. Which city are you currently located in?' },
      { sessionId: 'siddharth_session_1', role: 'user', text: 'Hey, I am from Kanpur.' },
      { sessionId: 'siddharth_session_1', role: 'model', text: 'Wonderful, Kanpur is an active region for our local drives. How many hours per week would you be able to dedicate to volunteering?' },
      { sessionId: 'siddharth_session_1', role: 'user', text: 'I can do around 4 hours a week.' }
    ],
    onboardingComplete: false
  });

  console.log('Creating campaigns...');
  const campaigns = await Campaign.create([
    {
      title: 'Underprivileged Children Education Drive',
      description: 'Weekly educational classes for children living in slums, teaching basics of English, Mathematics, and health hygiene.',
      location: 'Delhi',
      status: 'Active',
      date: new Date('2026-06-20'),
      requiredSkills: ['Teaching', 'Public Speaking']
    },
    {
      title: 'Menstrual Hygiene Awareness Camp',
      description: 'Distributing sanitary pads and holding awareness seminars for women in remote rural areas of Uttar Pradesh.',
      location: 'Kanpur',
      status: 'Active',
      date: new Date('2026-06-25'),
      requiredSkills: ['Public Speaking', 'Event Management']
    },
    {
      title: 'Street Animal Rescue & Feeding Campaign',
      description: 'Welfare campaign focusing on vaccinating, treating, and feeding stray dogs and cats across key regions of Mumbai.',
      location: 'Mumbai',
      status: 'Completed',
      date: new Date('2026-05-15'),
      requiredSkills: ['Animal Rescue']
    },
    {
      title: 'Winter Blanket & Basic Necessities Distribution',
      description: 'Seasonal distribution drive to provide warm clothing, blankets, and dry rations to homeless families.',
      location: 'Delhi',
      status: 'Draft',
      date: new Date('2026-11-10'),
      requiredSkills: ['Event Management']
    }
  ]);

  console.log('Creating campaign logs and copywriting updates...');
  await CampaignLog.create([
    {
      campaignId: campaigns[2]._id,
      rawNotes: 'Successfully fed over 120 stray dogs today in Mumbai and vaccinated 15 puppies. The community was highly supportive.',
      generatedCopy: {
        instagram: '🐾 Mumbai Paws United! Today, NayePankh Foundation vaccinated 15 puppies and fed 120+ stray dogs. Big thanks to our local community volunteers! ❤️ #AnimalWelfare #StrayRescue #NayePankh',
        twitter: 'Today we vaccinated 15 puppies and fed 120+ strays in Mumbai! Thanks to our volunteers for making a difference. 🐶🐱 #NGO #AnimalRescue',
        newsletter: 'Dear NayePankh Supporters, our Animal Welfare team had a highly successful feeding drive in Mumbai, serving over 120 stray animals and vaccinating 15 puppies against critical illnesses. Thank you for your continued support!'
      }
    },
    {
      campaignId: campaigns[0]._id,
      rawNotes: 'Conducted English alphabet and grammar session for 45 kids. Many kids showed great interest.',
      generatedCopy: {
        instagram: '📚 Educating the future! Our volunteers conducted a grammar session for 45 amazing kids today. Sparking joy in learning! ✨ #EducationForAll #ChildEducation #NayePankh',
        twitter: 'Teaching English grammar to 45 kids today! Educating a child is building a nation. 🇮🇳 #Education',
        newsletter: 'Hello Supporters, our Education Drive continues to expand. This week, our volunteers engaged 45 kids in Delhi with foundational English alphabet and grammar modules. The results have been inspiring!'
      }
    }
  ]);

  console.log('Creating donors...');
  const donors = await Donor.create([
    { name: 'Vikram Ahuja', email: 'vikram.a@gmail.com', lastDonationDate: new Date('2026-06-01'), donationFrequency: 3, totalDonated: 15000 },
    { name: 'Naina Kapoor', email: 'naina.k@gmail.com', lastDonationDate: new Date('2026-06-10'), donationFrequency: 1, totalDonated: 25000 },
    { name: 'Arjun Reddy', email: 'arjun.r@gmail.com', lastDonationDate: new Date('2026-04-12'), donationFrequency: 6, totalDonated: 5000 }
  ]);

  console.log('Creating donation details...');
  await Donation.create([
    { donorId: donors[0]._id, amount: 5000, date: new Date('2026-06-01'), campaignCategory: 'Education' },
    { donorId: donors[0]._id, amount: 10000, date: new Date('2026-03-01'), campaignCategory: 'Education' },
    { donorId: donors[1]._id, amount: 25000, date: new Date('2026-06-10'), campaignCategory: 'Hygiene' },
    { donorId: donors[2]._id, amount: 5000, date: new Date('2026-04-12'), campaignCategory: 'Animal Welfare' }
  ]);

  console.log('Creating agent checkpoints...');
  await AgentCheckpoint.create([
    {
      threadId: 'onboarding_thread_1',
      checkpointId: 'chk_1',
      parentCheckpointId: null,
      checkpoint: { state: { status: 'started', currentStep: 'greeting' } },
      metadata: { source: 'seed', type: 'volunteer_onboarding' }
    },
    {
      threadId: 'onboarding_thread_1',
      checkpointId: 'chk_2',
      parentCheckpointId: 'chk_1',
      checkpoint: { state: { status: 'in_progress', currentStep: 'location_asked' } },
      metadata: { source: 'seed', type: 'volunteer_onboarding' }
    }
  ]);

  console.log('Database seeding complete successfully!');
  await mongoose.disconnect();
  console.log('Disconnected from database.');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
