import mongoose from 'mongoose';

const searchCacheSchema = new mongoose.Schema({
  queryHash: { type: String, required: true, unique: true },
  results: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 6 },
});

export const SearchCache = mongoose.model('SearchCache', searchCacheSchema);
