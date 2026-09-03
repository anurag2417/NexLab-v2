import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  // Verification fields
  isVerified: boolean;
  emailVerifiedAt?: Date;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  // Password reset fields
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Social login fields
  googleId?: string;
  githubId?: string;
  avatar?: string;
  // Gamification fields
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  // Course fields
  enrolledCourses: Types.ObjectId[];
  progress: Map<string, string[]>;
  // Login tracking
  lastLoginAt?: Date;
  loginCount: number;
  isActive: boolean;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    // Verification fields
    isVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // Social login fields
    googleId: { type: String },
    githubId: { type: String },
    avatar: { type: String },
    // Gamification fields
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    // Course fields
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    progress: { type: Map, of: [String], default: () => new Map() },
    // Login tracking
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
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
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);