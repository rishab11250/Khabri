import mongoose from 'mongoose';

const jobLockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  lockedUntil: { type: Date, required: true },
});

export const JobLock = mongoose.model('JobLock', jobLockSchema);
