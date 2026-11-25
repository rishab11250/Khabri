import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    label: { type: String, default: '' },
  },
  { _id: false },
);

const extractedDateSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    iso: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  { _id: false },
);

const translationSchema = new mongoose.Schema(
  {
    why: { type: String, default: '' },
    checklist: { type: [String], default: [] },
  },
  { _id: false },
);

const changeSchema = new mongoose.Schema({
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
  detectedAt: { type: Date, default: Date.now },
  kind: { type: String, required: true },
  impact: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
  before: { type: String, default: '' },
  after: { type: String, default: '' },
  evidence: { type: [evidenceSchema], default: [] },
  trust: {
    type: String,
    enum: ['official', 'reported', 'unverified'],
    required: true,
  },
  analysis: {
    why: { type: String, default: '' },
    checklist: { type: [String], default: [] },
    dates: { type: [extractedDateSchema], default: [] },
  },
  translations: {
    hi: { type: translationSchema },
    gu: { type: translationSchema },
  },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
});

changeSchema.index({ sourceId: 1, detectedAt: -1 });
changeSchema.index({ detectedAt: -1 });

export const Change = mongoose.model('Change', changeSchema);
