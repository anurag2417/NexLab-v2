import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0, 'Price must be at least 0'),
  lessons: z.array(z.object({
    title: z.string().min(1, 'Lesson title is required'),
    description: z.string().optional(),
    videoUrl: z.string().url('Must be a valid URL'),
    duration: z.number().optional(),
    order: z.number(),
    isFree: z.boolean().default(false),
  })),
});

type CourseFormData = z.infer<typeof courseSchema>;

export const CourseForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const { register, control, handleSubmit, formState: { errors }, reset, setValue } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: 'beginner',
      price: 0,
      lessons: [{ title: '', videoUrl: '', order: 1, isFree: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lessons',
  });

  // Fetch course if editing
  useEffect(() => {
    if (id) {
      const fetchCourse = async () => {
        try {
          const response = await api.get(`/courses/${id}`);
          const course = response.data.data;
          reset({
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            price: course.price,
            lessons: course.lessons?.length ? course.lessons : [{ title: '', videoUrl: '', order: 1, isFree: false }],
          });
        } catch (error) {
          console.error('Error fetching course:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchCourse();
    }
  }, [id, reset]);

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      if (id) {
        await api.put(`/courses/${id}`, data);
      } else {
        await api.post('/courses', data);
      }
      navigate('/admin/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/courses')}
          className="p-2 hover:bg-background-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-body" />
        </button>
        <h1 className="text-2xl font-bold text-text-heading">
          {id ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-background-light border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-heading mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Title *
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., React Mastery 2025"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Category *
              </label>
              <input
                {...register('category')}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Programming, Design"
              />
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-text-body mb-1">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe what students will learn..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Level *
              </label>
              <select
                {...register('level')}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {errors.level && (
                <p className="text-red-500 text-xs mt-1">{errors.level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Price ($) *
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div className="bg-background-light border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-heading">Lessons</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: '', videoUrl: '', order: fields.length + 1, isFree: false })}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Lesson
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="border border-border rounded-lg p-4 mb-4 relative">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-2 right-2 p-1 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-body mb-1">
                    Lesson Title *
                  </label>
                  <input
                    {...register(`lessons.${index}.title`)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Lesson title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-body mb-1">
                    Video URL *
                  </label>
                  <input
                    {...register(`lessons.${index}.videoUrl`)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-text-body mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    {...register(`lessons.${index}.duration`, { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-body mb-1">
                    Order *
                  </label>
                  <input
                    {...register(`lessons.${index}.order`, { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 text-sm text-text-body">
                    <input
                      {...register(`lessons.${index}.isFree`)}
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
                    />
                    Free Lesson
                  </label>
                </div>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <p className="text-text-muted text-sm text-center py-4">
              No lessons yet. Click "Add Lesson" to get started.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/courses')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : id ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};