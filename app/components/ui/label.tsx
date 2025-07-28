import React from 'react';
import { cn } from '@/app/utils';

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export const Label = ({ children, htmlFor, className }: LabelProps) => (
  <label 
    htmlFor={htmlFor} 
    className={cn('block text-sm font-medium text-gray-700', className)}
  >
    {children}
  </label>
);