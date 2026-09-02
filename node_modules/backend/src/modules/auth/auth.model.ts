import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from '@nexlab/shared';
import bcrypt from 'bcryptjs';

// Fix: Use proper type extension without conflicting properties
export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  enrolledCourses: Types.ObjectId[];
  progress: Map<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
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
    progress: { 
      type: Map, 
      of: [String], 
      default: () => new Map()
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);