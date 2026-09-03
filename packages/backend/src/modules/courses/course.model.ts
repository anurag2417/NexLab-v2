import mongoose, { Schema, Document, Types } from 'mongoose';

// Lesson sub-document schema
export interface ILesson {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  order: number;
  isFree?: boolean;
}

// Main Course schema
export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: ILesson[];
  price: number;
  isPublished: boolean;
  instructor: Types.ObjectId;
  enrolledStudents: Types.ObjectId[];
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: Number, default: 0 },
  order: { type: Number, required: true },
  isFree: { type: Boolean, default: false },
}, { _id: true });

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    thumbnail: { type: String }, // ImageKit URL
    category: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'], 
      default: 'beginner' 
    },
    lessons: [LessonSchema],
    price: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from title
CourseSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export const Course = mongoose.model<ICourse>('Course', CourseSchema);