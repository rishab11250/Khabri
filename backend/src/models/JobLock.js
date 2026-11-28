/**
 * Mongoose model backing time-bounded distributed mutex locks for background tick runs.
 * Deliberately uses `lockedUntil` instead of process memory so external cron retries stay safe.
 */
import mongoose from 'mongoose';

const jobLockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Unique index enforces one lock record per job name.
  lockedUntil: { type: Date, required: true }, // Stale-lease expiry prevents permanent deadlock if a worker crashes.
});

export const JobLock = mongoose.model('JobLock', jobLockSchema);
