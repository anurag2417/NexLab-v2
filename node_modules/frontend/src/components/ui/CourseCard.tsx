import React from 'react';
import { Button } from './Button';
import { BookOpen, Clock } from 'lucide-react';

interface CourseCardProps {
  title: string;
  description: string;
  progress?: number; // 0 to 100
  image?: string;
  onEnroll?: () => void;
  onContinue?: () => void;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  progress = 0,
  image,
  onEnroll,
  onContinue,
  isEnrolled = false,
}) => {
  return (
    <div className="bg-background-light rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Image Placeholder with Gradient */}
      <div 
        className="h-40 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center"
        style={{ backgroundImage: image ? `url(${image})` : undefined }}
      >
        {!image && <BookOpen className="w-12 h-12 text-primary-300" />}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold text-text-heading line-clamp-1">{title}</h3>
        <p className="mt-1 text-sm text-text-body line-clamp-2">{description}</p>
        
        {/* Progress Bar (if enrolled) */}
        {isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Progress</span>
              <span className="text-primary-600 font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-background-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>{isEnrolled ? 'Resume' : 'Available'}</span>
          </div>
          {isEnrolled ? (
            <Button size="sm" variant="outline" onClick={onContinue}>
              Continue
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={onEnroll}>
              Enroll Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};