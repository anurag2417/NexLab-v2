import React from 'react';
import { Star } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'emerald' | 'info' | 'warning' | 'error';
  rating?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'emerald',
  rating,
}) => {
  const colorMap = {
    emerald: 'border-[#10B981]/20',
    info: 'border-[#60A5FA]/20',
    warning: 'border-[#FBBF24]/20',
    error: 'border-[#F87171]/20',
  };

  const iconColorMap = {
    emerald: 'text-[#10B981]',
    info: 'text-[#60A5FA]',
    warning: 'text-[#FBBF24]',
    error: 'text-[#F87171]',
  };

  return (
    <div className={`bg-[#161A19] rounded-xl border ${colorMap[color]} p-6 shadow-sm hover:shadow-[#10B981]/5 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#9CA3A0]">{title}</p>
          <p className="text-2xl font-bold text-[#EDEFEE] mt-1">{value}</p>
          {rating !== undefined && rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(rating)
                        ? 'fill-[#FBBF24] text-[#FBBF24]'
                        : 'text-[#2A302E]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#5C6360]">({rating.toFixed(1)})</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#161A19] border border-[#2A302E] ${iconColorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};