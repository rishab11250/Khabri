import mongoose from 'mongoose';

const watchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['normal', 'instant'], default: 'normal' },
    muted: { type: Boolean, default: false },
    createdVia: {
      type: String,
      enum: ['catalog', 'link', 'photo', 'trending', 'circle', 'search'],
      required: true,
    },
    circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle' },
    focusTerms: { type: [String], default: [] },
  },
  { timestamps: true },
);

watchSchema.index({ userId: 1 });
watchSchema.index({ sourceId: 1 });
watchSchema.index({ userId: 1, sourceId: 1 }, { unique: true });

export const Watch = mongoose.model('Watch', watchSchema);
