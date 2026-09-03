import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    courseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true,
      index: true,
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true,
    },
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5,
    },
    comment: { 
      type: String, 
      required: true,
      maxlength: 1000,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only review a course once
ReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);