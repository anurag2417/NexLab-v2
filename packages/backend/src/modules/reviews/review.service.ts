import { Types } from 'mongoose';
import { Review, IReview } from './review.model.js';
import { Course } from '../courses/course.model.js';

export class ReviewService {
  // Create a review
  static async createReview(
    courseId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<IReview> {
    // Check if user already reviewed this course
    const existingReview = await Review.findOne({ courseId, userId });
    if (existingReview) {
      throw new Error('You have already reviewed this course');
    }

    const review = await Review.create({
      courseId: new Types.ObjectId(courseId),
      userId: new Types.ObjectId(userId),
      rating,
      comment,
    });

    // Update course rating
    await this.updateCourseRating(courseId);

    return review;
  }

  // Update a review
  static async updateReview(
    reviewId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<IReview | null> {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new Error('Review not found or you are not authorized');
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Update course rating
    await this.updateCourseRating(review.courseId.toString());

    return review;
  }

  // Delete a review
  static async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new Error('Review not found or you are not authorized');
    }

    await review.deleteOne();

    // Update course rating
    await this.updateCourseRating(review.courseId.toString());

    return true;
  }

  // Get reviews for a course
  static async getCourseReviews(
    courseId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: any[]; total: number; averageRating: number }> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ courseId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ courseId }),
    ]);

    // Get average rating
    const ratingResult = await Review.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId) } },
      { $group: { _id: null, average: { $avg: '$rating' } } },
    ]);

    const averageRating = ratingResult.length > 0 ? ratingResult[0].average : 0;

    // Format reviews
    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        id: review.userId._id,
        name: (review.userId as unknown as { name: string }).name,
        email: (review.userId as unknown as { email: string }).email,
      },
    }));

    return {
      reviews: formattedReviews,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  // Get user's review for a course
  static async getUserReview(
    courseId: string,
    userId: string
  ): Promise<IReview | null> {
    return await Review.findOne({ courseId, userId });
  }

  // Update course rating
  static async updateCourseRating(courseId: string): Promise<void> {
    const result = await Review.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const average = result.length > 0 ? result[0].average : 0;
    const count = result.length > 0 ? result[0].count : 0;

    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(average * 10) / 10,
      totalReviews: count,
    });
  }

  // Get rating distribution for a course
  static async getRatingDistribution(courseId: string): Promise<Record<number, number>> {
    const distribution = await Review.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const result: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach((item) => {
      result[item._id] = item.count;
    });

    return result;
  }
}