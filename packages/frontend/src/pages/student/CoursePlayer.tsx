import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, CheckCircle, Lock, BookOpen, Award, Star, Zap,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { CourseReviews } from '../../components/CourseReviews';
import { QuizModal } from '../../components/QuizModal';

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
  instructor: { name: string };
  lessons: Lesson[];
  enrolledStudents: string[];
  rating?: number;
  totalReviews?: number;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: any[];
  timeLimit?: number;
  totalQuestions: number;
  isPublished: boolean;
}

export const CoursePlayer: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  
  // Quiz states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const currentLesson = course?.lessons[currentLessonIndex];

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchProgress();
    }
  }, [courseId]);

  useEffect(() => {
    if (currentLesson?._id) {
      fetchQuizzes();
      checkQuizCompletion();
    }
  }, [currentLesson]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/progress`);
      const data = response.data.data;
      setCompletedLessons(data.completedLessonIds || []);
      setProgress(data.percentage || 0);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchQuizzes = async () => {
    if (!currentLesson?._id) return;
    try {
      const response = await api.get(`/quizzes/lesson/${currentLesson._id}`);
      const data = response.data.data || [];
      setQuizzes(data.filter((q: Quiz) => q.isPublished));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const checkQuizCompletion = async () => {
    try {
      const response = await api.get('/quizzes/attempts');
      const attempts = response.data.data || [];
      const completed = attempts
        .filter((a: any) => a.completedAt && a.quizId)
        .map((a: any) => a.quizId._id || a.quizId);
      setCompletedQuizzes(completed);
      
      // Check if current lesson's quiz is completed
      if (quizzes.length > 0) {
        const isCompleted = completed.includes(quizzes[0]._id);
        setQuizCompleted(isCompleted);
      }
    } catch (error) {
      console.error('Error checking quiz completion:', error);
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      const response = await api.post(`/courses/${courseId}/${lessonId}/complete`);
      setXpEarned(response.data.data.xpEarned || 10);
      
      await fetchProgress();
      
      if (course && currentLessonIndex < course.lessons.length - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleQuizComplete = (score: number, passed: boolean) => {
    setQuizCompleted(true);
    setCompletedQuizzes([...completedQuizzes, selectedQuizId || '']);
    // Refresh data
    fetchCourse();
    fetchProgress();
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-[#9CA3A0]">Course not found</p>
        <Button variant="primary" onClick={() => navigate('/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  const totalLessons = course.lessons.length;
  const completedCount = completedLessons.length;

  // Check if all lessons are completed
  const allLessonsCompleted = completedCount === totalLessons && totalLessons > 0;

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-[#1E2322] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#9CA3A0]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFEE]">{course.title}</h1>
          <p className="text-[#9CA3A0] text-sm">Instructor: {course.instructor?.name || 'Unknown'}</p>
          {course.rating && course.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
              <span className="text-sm font-medium text-[#EDEFEE]">{course.rating.toFixed(1)}</span>
              <span className="text-xs text-[#5C6360]">({course.totalReviews || 0} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between text-sm text-[#9CA3A0] mb-2">
          <span>Course Progress</span>
          <span className="text-[#10B981] font-semibold">{progress}% Complete</span>
        </div>
        <div className="w-full h-1.5 bg-[#0D0F0F] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-[#5C6360]">
          <span>{completedCount} of {totalLessons} lessons completed</span>
          {xpEarned > 0 && (
            <span className="text-[#10B981] font-medium">+{xpEarned} XP earned!</span>
          )}
          {allLessonsCompleted && (
            <span className="text-[#FBBF24] font-medium">🎉 Course Complete!</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video bg-[#0D0F0F] flex items-center justify-center">
              {currentLesson?.videoUrl ? (
                <iframe
                  src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <div className="text-center">
                  <Play className="w-16 h-16 text-[#5C6360] mx-auto" />
                  <p className="text-[#5C6360] mt-2">Video coming soon</p>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#EDEFEE]">
                    {currentLesson?.title || 'No lesson selected'}
                  </h2>
                  {currentLesson?.description && (
                    <p className="text-[#9CA3A0] mt-2">{currentLesson.description}</p>
                  )}
                </div>
                {currentLesson && (
                  <Button
                    variant={isLessonCompleted(currentLesson._id) ? 'outline' : 'primary'}
                    onClick={() => handleCompleteLesson(currentLesson._id)}
                    disabled={isLessonCompleted(currentLesson._id)}
                    className="flex-shrink-0 ml-4"
                  >
                    {isLessonCompleted(currentLesson._id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson List */}
        <div className="lg:col-span-1">
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#2A302E]">
              <h3 className="font-semibold text-[#EDEFEE]">Course Content</h3>
              <p className="text-xs text-[#5C6360]">{totalLessons} lessons</p>
            </div>
            <div className="divide-y divide-[#2A302E] max-h-[500px] overflow-y-auto">
              {course.lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson._id);
                const isCurrent = index === currentLessonIndex;

                return (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`
                      w-full text-left p-4 hover:bg-[#1E2322] transition-colors flex items-center gap-3
                      ${isCurrent ? 'bg-[#10B981]/5 border-l-4 border-[#10B981]' : ''}
                      ${isCompleted ? 'opacity-75' : ''}
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-[#5C6360]">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCurrent ? 'text-[#10B981] font-medium' : 'text-[#9CA3A0]'}`}>
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-[#5C6360]">{lesson.duration} min</p>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-xs text-[#10B981] font-medium">Done</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
          disabled={currentLessonIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Lesson
        </Button>
        <Button
          variant="primary"
          onClick={() => setCurrentLessonIndex(Math.min(totalLessons - 1, currentLessonIndex + 1))}
          disabled={currentLessonIndex === totalLessons - 1}
          className="gap-1"
        >
          Next Lesson
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Quiz Section */}
      {quizzes.length > 0 && (
        <div className="mt-6 p-4 bg-[#161A19] border border-[#2A302E] rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FBBF24]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FBBF24]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#EDEFEE]">Test Your Knowledge</h3>
                <p className="text-sm text-[#9CA3A0]">
                  {quizCompleted 
                    ? 'You have completed this quiz! 🎉' 
                    : 'Take the quiz to earn extra XP'}
                </p>
              </div>
            </div>
            <Button
              variant={quizCompleted ? 'outline' : 'primary'}
              size="sm"
              onClick={() => {
                const quiz = quizzes[0];
                setSelectedQuizId(quiz._id);
                setIsQuizModalOpen(true);
              }}
              disabled={quizCompleted}
            >
              {quizCompleted ? 'Completed ✅' : 'Start Quiz'}
            </Button>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {selectedQuizId && currentLesson && (
        <QuizModal
          quizId={selectedQuizId}
          lessonId={currentLesson._id}
          isOpen={isQuizModalOpen}
          onClose={() => {
            setIsQuizModalOpen(false);
            setSelectedQuizId(null);
          }}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Reviews Section */}
      <div className="mt-8 pt-8 border-t border-[#2A302E]">
        <h2 className="text-xl font-bold text-[#EDEFEE] mb-4">Course Reviews</h2>
        <CourseReviews 
          courseId={course._id} 
          onReviewChange={() => {
            fetchCourse();
          }}
        />
      </div>
    </div>
  );
};