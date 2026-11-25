import mongoose from 'mongoose';

const aiCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  output: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

export const AiCache = mongoose.model('AiCache', aiCacheSchema);
