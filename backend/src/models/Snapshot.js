/**
 * Mongoose model persisting point-in-time fetched source states used for diffing consecutive ticks.
 * Deliberately pruned to the latest 10 snapshots per source by `scheduler.pruneSnapshots`.
 */
import mongoose from 'mongoose';

const snapshotItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    href: { type: String, default: '' },
    dateText: { type: String, default: '' },
  },
  { _id: false },
);

const snapshotSchema = new mongoose.Schema({
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
  takenAt: { type: Date, default: Date.now },
  contentHash: { type: String, required: true }, // SHA-256 of canonical listing items or normalized page text.
  items: { type: [snapshotItemSchema], default: [] },
  textExcerpt: { type: String, default: '' },
});

// Serves fast latest-snapshot lookups (`sort({ takenAt: -1 })`) and retention pruning per source.
snapshotSchema.index({ sourceId: 1, takenAt: -1 });

export const Snapshot = mongoose.model('Snapshot', snapshotSchema);
