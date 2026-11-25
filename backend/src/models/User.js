import mongoose from 'mongoose';

const quietHoursSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '07:00' },
    bypassHighUrgent: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true, default: '' },
    language: { type: String, enum: ['en', 'hi', 'gu'], default: 'en' },
    state: { type: String, trim: true, default: 'All India' },
    interests: { type: [String], default: [] },
    quietHours: { type: quietHoursSchema, default: () => ({}) },
    digestTime: { type: String, default: '08:00' },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const User = mongoose.model('User', userSchema);
