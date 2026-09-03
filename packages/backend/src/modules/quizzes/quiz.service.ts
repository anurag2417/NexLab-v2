import { Types } from 'mongoose';
import { Quiz, QuizAttempt, IQuiz, IQuizAttempt } from './quiz.model.js';
import { Course } from '../courses/course.model.js';
import { User } from '../auth/auth.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';

export class QuizService {
  // ---------- Quiz CRUD ----------
  
  static async createQuiz(data: Partial<IQuiz>): Promise<IQuiz> {
    const quiz = await Quiz.create(data);
    return quiz;
  }

  static async getQuizById(quizId: string): Promise<IQuiz | null> {
    return await Quiz.findById(quizId).populate('courseId', 'title');
  }

  static async getQuizzesByLesson(lessonId: string): Promise<IQuiz[]> {
    return await Quiz.find({ lessonId, isPublished: true })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
  }

  static async getQuizzesByCourse(courseId: string): Promise<IQuiz[]> {
    return await Quiz.find({ courseId, isPublished: true })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
  }

  static async updateQuiz(quizId: string, data: Partial<IQuiz>): Promise<IQuiz | null> {
    return await Quiz.findByIdAndUpdate(quizId, data, { new: true, runValidators: true });
  }

  static async deleteQuiz(quizId: string): Promise<boolean> {
    const result = await Quiz.findByIdAndDelete(quizId);
    return !!result;
  }

  static async togglePublish(quizId: string): Promise<IQuiz | null> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;
    quiz.isPublished = !quiz.isPublished;
    await quiz.save();
    return quiz;
  }

  // ---------- Quiz Attempts ----------
  
  static async startQuiz(quizId: string, userId: string): Promise<IQuizAttempt> {
    // Check if user already attempted
    const existing = await QuizAttempt.findOne({ quizId, userId });
    if (existing) {
      // If completed, return existing
      if (existing.completedAt) {
        throw new Error('You have already completed this quiz');
      }
      return existing;
    }

    const attempt = await QuizAttempt.create({
      quizId: new Types.ObjectId(quizId),
      userId: new Types.ObjectId(userId),
      startedAt: new Date(),
    });

    return attempt;
  }

  static async submitQuiz(
    quizId: string,
    userId: string,
    answers: number[]
  ): Promise<{ attempt: IQuizAttempt; score: number; passed: boolean; feedback: any[] }> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const attempt = await QuizAttempt.findOne({ quizId, userId });
    if (!attempt) {
      throw new Error('Quiz not started');
    }

    if (attempt.completedAt) {
      throw new Error('Quiz already completed');
    }

    // Calculate score
    let correctCount = 0;
    const feedback = quiz.questions.map((question, index) => {
      const userAnswer = answers[index] ?? -1;
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: question.question,
        userAnswer: userAnswer === -1 ? 'Not answered' : question.options[userAnswer] || 'Invalid',
        correctAnswer: question.options[question.correctAnswer],
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Update attempt
    attempt.answers = answers;
    attempt.score = score;
    attempt.passed = passed;
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor(
      (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
    );

    await attempt.save();

    // Award XP if passed
    if (passed) {
      const xpGain = Math.round(score / 10) + 5; // 5-15 XP based on score
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + xpGain;
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        await user.save();
        await LeaderboardService.updateUserScore(userId, user.xp);
      }
    }

    return {
      attempt,
      score,
      passed,
      feedback,
    };
  }

  static async getAttempts(userId: string, quizId?: string): Promise<any[]> {
    const query: any = { userId };
    if (quizId) query.quizId = quizId;

    return await QuizAttempt.find(query)
      .populate('quizId', 'title')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getQuizStats(quizId: string): Promise<any> {
    const attempts = await QuizAttempt.find({ quizId });
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.passed).length;
    const avgScore = attempts.reduce((acc, a) => acc + a.score, 0) / (totalAttempts || 1);

    return {
      totalAttempts,
      passedAttempts,
      passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      averageScore: Math.round(avgScore),
    };
  }
}