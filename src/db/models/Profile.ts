import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  resumeText: string;
  requirementsText: string;
  targetTitles: string[];
  targetLocations: string[];
  embedding: number[];
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema({
  resumeText: { type: String, required: true },
  requirementsText: { type: String, required: true },
  targetTitles: { type: [String], default: [] },
  targetLocations: { type: [String], default: [] },
  embedding: { type: [Number], required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProfile>('Profile', ProfileSchema);
