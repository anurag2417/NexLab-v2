// packages/frontend/src/components/BrandLogo.tsx

import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  rounded = 'full',
}) => {
  // ✅ Replace this URL with your actual logo URL from ImageKit
  const logoUrl = 'https://ik.imagekit.io/djimomx5ff/NexLab-Logo-100Kb.png';
  
  // ✅ Replace with your favicon URL from ImageKit (16x16 or 32x32)
  const faviconUrl = 'https://ik.imagekit.io/djimomx5ff/favicon.png';
  
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoUrl}
        alt="NexLab Logo"
        className={`${sizes[size]} ${roundedClasses[rounded]} object-cover border border-[#2A302E]`}
      />
      {showText && (
        <div className="flex items-center">
          <span className={`font-bold text-[#10B981] ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
            Nex
          </span>
          <span className={`font-bold text-[#EDEFEE] ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
            Lab
          </span>
        </div>
      )}
    </Link>
  );
};

export default BrandLogo;