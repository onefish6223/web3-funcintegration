import React from 'react';
import { cn } from '@/app/utils';

interface SeparatorProps {
  className?: string;
}

export const Separator = ({ className }: SeparatorProps) => (
  <hr className={cn('my-4 border-gray-200', className)} />
);