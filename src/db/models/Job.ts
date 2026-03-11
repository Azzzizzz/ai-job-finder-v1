import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  urlHash: string;
  source: string;
  postedAt: Date;
  embedding?: number[];
  similarityScore?: number;
  finalScore?: number;
  processed: boolean;
  explanation?: {
    summary: string;
    skillsOverlap: string[];
    relevanceExplanation: string;
  };
  createdAt: Date;
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  urlHash: { type: String, required: true, index: true },
  source: { type: String, required: true },
  postedAt: { type: Date, required: true },
  embedding: { type: [Number], select: false }, // Don't return by default
  similarityScore: { type: Number },
  finalScore: { type: Number },
  processed: { type: Boolean, default: false },
  explanation: {
    summary: { type: String },
    skillsOverlap: { type: [String] },
    relevanceExplanation: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

// Indexes
JobSchema.index({ company: 1, title: 1, location: 1 });
JobSchema.index({ postedAt: -1 });
JobSchema.index({ processed: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
