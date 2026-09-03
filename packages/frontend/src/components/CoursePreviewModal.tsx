import React, { useState } from 'react';
import {
    X, BookOpen,
    Play, CheckCircle, Star
} from 'lucide-react';
import { Button } from './ui/Button';

interface Lesson {
    _id: string;
    title: string;
    description?: string;
    videoUrl: string;
    duration?: number;
    order: number;
    isFree: boolean;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    isPublished: boolean;
    lessons: Lesson[];
    enrolledStudents: string[];
    rating?: number;
    totalReviews?: number;
    instructor?: { name: string; email: string };
    createdAt: string;
}

interface CoursePreviewModalProps {
    course: Course;
    isOpen: boolean;
    onClose: () => void;
    onEnroll?: () => void;
    isEnrolled?: boolean;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
    course,
    isOpen,
    onClose,
    onEnroll,
    isEnrolled = false,
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');

    if (!isOpen) return null;

    const getLevelBadge = (level: string) => {
        const colors: Record<string, string> = {
            beginner: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
            intermediate: 'bg-[#60A5FA]/20 text-[#60A5FA] border-[#60A5FA]/30',
            advanced: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
        };
        return colors[level] || 'bg-[#2A302E] text-[#9CA3A0] border-[#2A302E]';
    };

    const getDurationText = (duration?: number) => {
        if (!duration) return 'N/A';
        if (duration < 60) return `${duration} min`;
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    // Calculate total duration
    const totalDuration = course.lessons?.reduce((acc, lesson) => acc + (lesson.duration || 0), 0) || 0;
    const totalLessons = course.lessons?.length || 0;

    // Mock reviews (will be replaced with real data later)
    const mockReviews = [
        { id: 1, user: 'Alice Johnson', rating: 5, comment: 'Excellent course! Very well structured and easy to follow.', date: '2024-01-15' },
        { id: 2, user: 'Bob Smith', rating: 4, comment: 'Great content, but could use more practical examples.', date: '2024-01-10' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0F0F]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-[#10B981]/10">
                {/* Header with close button */}
                <div className="flex items-center justify-between p-6 border-b border-[#2A302E]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#EDEFEE]">{course.title}</h2>
                            <p className="text-xs text-[#5C6360]">Course Preview</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#1E2322] rounded-lg transition-colors text-[#9CA3A0] hover:text-[#EDEFEE]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                    {/* Course Header */}
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getLevelBadge(course.level)}`}>
                                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                            </span>
                            <span className="text-xs text-[#5C6360]">•</span>
                            <span className="text-xs text-[#5C6360]">{course.category}</span>
                            <span className="text-xs text-[#5C6360]">•</span>
                            <span className="text-xs text-[#5C6360]">{totalLessons} lessons</span>
                            <span className="text-xs text-[#5C6360]">•</span>
                            <span className="text-xs text-[#5C6360]">{getDurationText(totalDuration)}</span>
                            {course.rating && (
                                <>
                                    <span className="text-xs text-[#5C6360]">•</span>
                                    <span className="text-xs text-[#FBBF24] flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-[#FBBF24]" />
                                        {course.rating.toFixed(1)} ({course.totalReviews || 0} reviews)
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-[#9CA3A0] text-sm leading-relaxed">{course.description}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-[#0D0F0F] rounded-xl">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#10B981]">{course.enrolledStudents?.length || 0}</p>
                            <p className="text-xs text-[#5C6360]">Students</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#60A5FA]">{totalLessons}</p>
                            <p className="text-xs text-[#5C6360]">Lessons</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#FBBF24]">{getDurationText(totalDuration)}</p>
                            <p className="text-xs text-[#5C6360]">Total Duration</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#EDEFEE]">${course.price}</p>
                            <p className="text-xs text-[#5C6360]">Price</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#2A302E] mb-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
                                    ? 'border-[#10B981] text-[#10B981]'
                                    : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('curriculum')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'curriculum'
                                    ? 'border-[#10B981] text-[#10B981]'
                                    : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                                }`}
                        >
                            Curriculum ({totalLessons})
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'reviews'
                                    ? 'border-[#10B981] text-[#10B981]'
                                    : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                                }`}
                        >
                            Reviews
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-[#EDEFEE] mb-2">About This Course</h4>
                                    <p className="text-sm text-[#9CA3A0] leading-relaxed">{course.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#0D0F0F] rounded-lg p-4">
                                        <h5 className="text-xs font-semibold text-[#EDEFEE] mb-3">What You'll Learn</h5>
                                        <ul className="space-y-2">
                                            {course.lessons?.slice(0, 4).map((lesson, index) => (
                                                <li key={index} className="flex items-start gap-2 text-xs text-[#9CA3A0]">
                                                    <CheckCircle className="w-3.5 h-3.5 text-[#10B981] mt-0.5 flex-shrink-0" />
                                                    <span>{lesson.title}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {course.lessons?.length > 4 && (
                                            <p className="text-xs text-[#5C6360] mt-2">+ {course.lessons.length - 4} more lessons</p>
                                        )}
                                    </div>
                                    <div className="bg-[#0D0F0F] rounded-lg p-4">
                                        <h5 className="text-xs font-semibold text-[#EDEFEE] mb-3">Course Details</h5>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-[#5C6360]">Category</span>
                                                <span className="text-[#EDEFEE]">{course.category}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#5C6360]">Level</span>
                                                <span className="text-[#EDEFEE] capitalize">{course.level}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#5C6360]">Instructor</span>
                                                <span className="text-[#EDEFEE]">{course.instructor?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#5C6360]">Created</span>
                                                <span className="text-[#EDEFEE]">{new Date(course.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Curriculum Tab */}
                        {activeTab === 'curriculum' && (
                            <div className="space-y-2">
                                {course.lessons?.map((lesson, index) => (
                                    <div
                                        key={lesson._id}
                                        className="flex items-center justify-between p-3 bg-[#0D0F0F] rounded-lg hover:bg-[#1E2322] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-[#5C6360] min-w-[24px]">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <div>
                                                <p className="text-sm text-[#EDEFEE]">{lesson.title}</p>
                                                {lesson.description && (
                                                    <p className="text-xs text-[#5C6360]">{lesson.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {lesson.isFree && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                                                    Free
                                                </span>
                                            )}
                                            <span className="text-xs text-[#5C6360]">{getDurationText(lesson.duration)}</span>
                                            <Play className="w-4 h-4 text-[#5C6360]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-[#0D0F0F] rounded-lg">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-[#FBBF24]">{course.rating?.toFixed(1) || '4.5'}</p>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= (course.rating || 4.5)
                                                            ? 'fill-[#FBBF24] text-[#FBBF24]'
                                                            : 'text-[#2A302E]'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-[#5C6360] mt-1">{course.totalReviews || 12} reviews</p>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const count = Math.floor(Math.random() * 5) + 1;
                                            const percentage = (count / 12) * 100;
                                            return (
                                                <div key={rating} className="flex items-center gap-2">
                                                    <span className="text-xs text-[#5C6360] min-w-[20px]">{rating}⭐</span>
                                                    <div className="flex-1 h-1.5 bg-[#2A302E] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#FBBF24] rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-[#5C6360] min-w-[20px]">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Review List */}
                                <div className="space-y-3">
                                    {mockReviews.map((review) => (
                                        <div key={review.id} className="p-3 bg-[#0D0F0F] rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center text-xs font-bold">
                                                        {review.user.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-[#EDEFEE]">{review.user}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-3 h-3 ${star <= review.rating
                                                                    ? 'fill-[#FBBF24] text-[#FBBF24]'
                                                                    : 'text-[#2A302E]'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-[#9CA3A0]">{review.comment}</p>
                                            <p className="text-xs text-[#5C6360] mt-1">{new Date(review.date).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#2A302E] bg-[#0D0F0F]">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#10B981]">${course.price}</p>
                            <p className="text-xs text-[#5C6360]">Full course access</p>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-[#2A302E]" />
                        <div className="text-xs text-[#5C6360]">
                            <p>✅ {totalLessons} lessons</p>
                            <p>✅ {getDurationText(totalDuration)} of content</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
                            Close
                        </Button>
                        {isEnrolled ? (
                            <Button variant="outline" onClick={onEnroll} className="flex-1 sm:flex-none">
                                <Play className="w-4 h-4 mr-2" />
                                Continue Learning
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={onEnroll} className="flex-1 sm:flex-none">
                                {course.price === 0 ? 'Enroll Free' : `Enroll for $${course.price}`}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};