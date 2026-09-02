import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  fullWidth = false,
  ...props 
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-base disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#10B981] text-white hover:bg-[#34D399] active:bg-[#059669] focus:ring-[#10B981]',
    secondary: 'bg-[#161A19] text-[#EDEFEE] hover:bg-[#1E2322] focus:ring-[#10B981] border border-[#2A302E]',
    outline: 'border border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white focus:ring-[#10B981]',
    ghost: 'text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#161A19] focus:ring-[#10B981]',
    danger: 'bg-[#F87171] text-white hover:bg-[#F87171]/80 focus:ring-[#F87171]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};