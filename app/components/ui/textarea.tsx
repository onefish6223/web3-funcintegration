import React from 'react';
import { cn } from '@/app/utils';

interface TextareaProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}

export const Textarea = ({ 
  id, 
  placeholder, 
  value, 
  onChange, 
  className,
  rows = 3 
}: TextareaProps) => (
  <textarea
    id={id}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={cn(
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
      className
    )}
  />
);