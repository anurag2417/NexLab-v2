// packages/frontend/src/components/ImageUpload.tsx

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/Button';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'square' | '16:9' | '4:3' | 'free';
  maxSizeMB?: number; // ✅ Added max size
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Course Image',
  placeholder = 'Upload an image...',
  className = '',
  aspectRatio = '16:9',
  maxSizeMB = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size should be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate dimensions for specific aspect ratios
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      if (aspectRatio !== 'free') {
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
        const imgRatio = img.width / img.height;
        const targetRatio = ratioW / ratioH;
        
        if (Math.abs(imgRatio - targetRatio) > 0.1) {
          setError(`Image should be approximately ${aspectRatio} ratio. Current: ${img.width}x${img.height}`);
          return;
        }
      }
      
      // Proceed with upload
      processImage(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Failed to load image');
    };
    img.src = objectUrl;
  };

  const processImage = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
      setIsUploading(false);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-[4/3]';
      default:
        return '';
    }
  };

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
        {label}
      </label>

      {error && (
        <div className="mb-2 p-2 bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg text-[#F87171] text-xs">
          {error}
        </div>
      )}

      {preview ? (
        <div className={`relative w-full ${getAspectRatioClass()} bg-[#0D0F0F] rounded-lg border border-[#2A302E] overflow-hidden group`}>
          <img
            src={preview}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-[#161A19] border border-[#2A302E] rounded-lg text-[#9CA3A0] hover:text-[#EDEFEE] hover:bg-[#1E2322] transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-[#161A19] border border-[#2A302E] rounded-lg text-[#9CA3A0] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#161A19]/80 border border-[#2A302E] rounded text-xs text-[#5C6360]">
            Click to change
          </div>
        </div>
      ) : (
        <div
          className={`relative w-full ${getAspectRatioClass()} border-2 border-dashed rounded-lg transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
            isDragging
              ? 'border-[#10B981] bg-[#10B981]/5'
              : 'border-[#2A302E] hover:border-[#10B981]/30 bg-[#0D0F0F]'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#10B981] border-t-transparent" />
              <p className="text-sm text-[#5C6360] mt-2">Uploading...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-[#5C6360] opacity-40" />
              <p className="text-sm font-medium text-[#9CA3A0] mt-2">{placeholder}</p>
              <p className="text-xs text-[#5C6360] mt-1">PNG, JPG, WEBP up to {maxSizeMB}MB</p>
              {aspectRatio !== 'free' && (
                <p className="text-xs text-[#5C6360] mt-0.5">Recommended: {aspectRatio} ratio</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;