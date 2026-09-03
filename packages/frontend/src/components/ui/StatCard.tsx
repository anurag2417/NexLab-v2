import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'emerald' | 'info' | 'warning' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon = 'emerald' }) => {
  // const colorMap = {
  //   emerald: 'bg-[#10B981]',
  //   info: 'bg-[#60A5FA]',
  //   warning: 'bg-[#FBBF24]',
  //   error: 'bg-[#F87171]',
  // };

  return (
    <div className="bg-[#161A19] rounded-xl border border-[#2A302E] p-6 shadow-sm hover:shadow-[#10B981]/5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#9CA3A0]">{title}</p>
          <p className="text-2xl font-bold text-[#EDEFEE] mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#161A19] border border-[#2A302E]`}>
          {icon}
        </div>
      </div>
    </div>
  );
};