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
  contentHash: { type: String, required: true },
  items: { type: [snapshotItemSchema], default: [] },
  textExcerpt: { type: String, default: '' },
});

snapshotSchema.index({ sourceId: 1, takenAt: -1 });

export const Snapshot = mongoose.model('Snapshot', snapshotSchema);
