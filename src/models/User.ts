import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Coordinator', 'Volunteer'],
      default: 'Volunteer',
    },
  },
  { timestamps: true }
);

// Encrypt password before saving
UserSchema.pre('save', async function () {
  const self = this as any;
  if (!self.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    self.password = await bcrypt.hash(self.password, salt);
  } catch (error) {
    throw error as Error;
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  const self = this as any;
  return bcrypt.compare(password, self.password);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
