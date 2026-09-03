import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  title: string;
  description?: string;
  questions: IQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: number[]; // selected option indices
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt: Date;
  timeSpent: number; // in seconds
}

const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: [(arr: string[]) => arr.length >= 2, 'At least 2 options required'] },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String },
});

const QuizSchema = new Schema<IQuiz>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: { type: [QuestionSchema], required: true, validate: [(arr: IQuestion[]) => arr.length >= 1, 'At least 1 question required'] },
    passingScore: { type: Number, required: true, default: 60, min: 0, max: 100 },
    timeLimit: { type: Number, default: null }, // null means no time limit
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [Number], default: [] },
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure one attempt per user per quiz
QuizAttemptSchema.index({ quizId: 1, userId: 1 }, { unique: true });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);