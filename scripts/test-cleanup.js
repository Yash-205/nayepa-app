const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read MONGODB_URI from .env.local
let mongodbUri = 'mongodb://localhost:27017/nayepa';
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^MONGODB_URI=(.+)$/m);
    if (match) {
      mongodbUri = match[1].trim();
    }
  }
} catch (e) {
  console.log('Error reading .env.local, falling back to default URI.');
}

async function cleanup() {
  console.log(`Connecting to MongoDB at: ${mongodbUri}`);
  await mongoose.connect(mongodbUri);
  
  const testEmails = [
    'test-volunteer@nayepankh.org',
    'test-coordinator@nayepankh.org',
    'test-admin@nayepankh.org'
  ];
  
  console.log('Cleaning up test accounts...');
  const result = await mongoose.connection.db.collection('users').deleteMany({
    email: { $in: testEmails }
  });
  
  console.log(`Successfully deleted ${result.deletedCount} test accounts.`);
  await mongoose.disconnect();
}

cleanup().catch((err) => {
  console.error('Database cleanup failed:', err);
  process.exit(1);
});
