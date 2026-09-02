import React from 'react';
import { Button } from './Button';
import { BookOpen, Clock } from 'lucide-react';

interface CourseCardProps {
  title: string;
  description: string;
  progress?: number;
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
    <div className="bg-[#161A19] rounded-xl border border-[#2A302E] shadow-sm hover:shadow-[#10B981]/5 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Image with gradient overlay */}
      <div 
        className="h-48 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/10 flex items-center justify-center relative"
        style={{ backgroundImage: image ? `url(${image})` : undefined }}
      >
        {!image && <BookOpen className="w-12 h-12 text-[#10B981] opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161A19] to-transparent opacity-60" />
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold text-[#EDEFEE] line-clamp-1">{title}</h3>
        <p className="mt-1 text-sm text-[#9CA3A0] line-clamp-2">{description}</p>
        
        {/* Progress Bar */}
        {isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#9CA3A0] mb-1">
              <span>Progress</span>
              <span className="text-[#10B981] font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#0D0F0F] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-[#9CA3A0]">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
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