import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isPublished: boolean;
  enrolledStudents: string[];
  lessons: any[];
  createdAt: string;
}

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c._id !== id));
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const response = await api.patch(`/courses/${id}/publish`);
      setCourses(courses.map(c => c._id === id ? response.data.data : c));
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-success-100 text-success-700',
      intermediate: 'bg-secondary-100 text-secondary-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header with Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Manage Courses</h1>
          <p className="text-text-body mt-1">Create and manage your course content</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/courses/create')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <div className="bg-background-light border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted">No courses found. Create your first course!</p>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/courses/create')}
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Course
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-background-light border border-border rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold text-text-heading truncate">
                      {course.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelBadge(course.level)}`}>
                      {course.level}
                    </span>
                    {course.isPublished ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success-100 text-success-700 font-medium">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-body truncate">{course.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted flex-wrap">
                    <span>Category: {course.category}</span>
                    <span>•</span>
                    <span>${course.price}</span>
                    <span>•</span>
                    <span>{course.enrolledStudents?.length || 0} students</span>
                    <span>•</span>
                    <span>{course.lessons?.length || 0} lessons</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(course._id)}
                    className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title={course.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {course.isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/courses/edit/${course._id}`)}
                    className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};