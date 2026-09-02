import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from '@nexlab/shared';

// Create a clean Document interface that extends Mongoose's Document
// and matches our IUser shape without conflicting on '_id'
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  _id: Types.ObjectId; // Mongoose's actual type
  password: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(candidate, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);