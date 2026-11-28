/**
 * Mongoose model storing user profiles, localization preferences, and notification quiet hours.
 * Deliberately links via `supabaseId` so Supabase owns credentials while MongoDB holds app data.
 */
import mongoose from 'mongoose';

const quietHoursSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    start: { type: String, default: '22:00' }, // 24h IST start time (`HH:MM`).
    end: { type: String, default: '07:00' }, // 24h IST end time (`HH:MM`).
    bypassHighUrgent: { type: Boolean, default: false }, // Lets HIGH updates with <=24h deadlines ring during quiet hours.
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true }, // Immutable Supabase Auth `sub` UUID.
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true, default: '' },
    language: { type: String, enum: ['en', 'hi', 'gu'], default: 'en' },
    state: { type: String, trim: true, default: 'All India' },
    interests: { type: [String], default: [] },
    quietHours: { type: quietHoursSchema, default: () => ({}) },
    digestTime: { type: String, default: '08:00' }, // Preferred IST digest dispatch HH:MM.
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const User = mongoose.model('User', userSchema);
