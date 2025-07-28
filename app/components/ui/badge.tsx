import React from 'react';
import { cn } from '@/app/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => (
  <span className={cn(
    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    variant === 'outline' 
      ? 'border border-gray-300 text-gray-700' 
      : 'bg-blue-100 text-blue-800',
    className
  )}>
    {children}
  </span>
);