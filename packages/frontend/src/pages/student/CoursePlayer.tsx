import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

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

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchProgress();
    }
  }, [courseId]);

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

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-text-body">Course not found</p>
        <Button variant="primary" onClick={() => navigate('/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  const currentLesson = course.lessons[currentLessonIndex];
  const totalLessons = course.lessons.length;
  const completedCount = completedLessons.length;

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-background-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-body" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-heading">{course.title}</h1>
          <p className="text-text-body text-sm">Instructor: {course.instructor?.name || 'Unknown'}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-background-light border border-border rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between text-sm text-text-body mb-2">
          <span>Course Progress</span>
          <span className="text-primary-600 font-semibold">{progress}% Complete</span>
        </div>
        <div className="w-full h-2 bg-background-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
          <span>{completedCount} of {totalLessons} lessons completed</span>
          {xpEarned > 0 && (
            <span className="text-secondary-600 font-medium">+{xpEarned} XP earned!</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-background-light border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {currentLesson?.videoUrl ? (
                <iframe
                  src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <div className="text-center">
                  <Play className="w-16 h-16 text-gray-600 mx-auto" />
                  <p className="text-gray-400 mt-2">Video coming soon</p>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-heading">
                    {currentLesson?.title || 'No lesson selected'}
                  </h2>
                  {currentLesson?.description && (
                    <p className="text-text-body mt-2">{currentLesson.description}</p>
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
          <div className="bg-background-light border border-border rounded-xl shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-heading">Course Content</h3>
              <p className="text-xs text-text-muted">{totalLessons} lessons</p>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {course.lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson._id);
                const isCurrent = index === currentLessonIndex;

                return (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`
                      w-full text-left p-4 hover:bg-background-muted transition-colors flex items-center gap-3
                      ${isCurrent ? 'bg-primary-50 border-l-4 border-primary-600' : ''}
                      ${isCompleted ? 'opacity-75' : ''}
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-success-500" />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-text-muted">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCurrent ? 'text-primary-600 font-medium' : 'text-text-body'}`}>
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-text-muted">{lesson.duration} min</p>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-xs text-success-600 font-medium">Done</span>
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
        >
          Previous Lesson
        </Button>
        <Button
          variant="primary"
          onClick={() => setCurrentLessonIndex(Math.min(totalLessons - 1, currentLessonIndex + 1))}
          disabled={currentLessonIndex === totalLessons - 1}
        >
          Next Lesson
        </Button>
      </div>
    </div>
  );
};