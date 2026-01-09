import React from 'react';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  type LucideIcon as LucideIconType
} from 'lucide-react';

interface LucideIconProps {
  icon: LucideIconType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

/**
 * LucideIcon Component
 * 
 * DRY Principle: Standardizes Lucide icon usage
 * - Consistent sizing system
 * - Centralized icon imports
 * - Proper accessibility
 */
export function LucideIcon({
  icon: Icon,
  size = 'md',
  className,
  ...props
}: LucideIconProps & React.ComponentProps<'svg'>) {
  return (
    <Icon
      className={cn(sizeClasses[size], className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Pre-configured Navigation Icons
 */
export function MenuIcon({ size = 'lg', className, ...props }: Omit<LucideIconProps, 'icon'>) {
  return <LucideIcon icon={Menu} size={size} className={className} {...props} />
}

export function CloseIcon({ size = 'lg', className, ...props }: Omit<LucideIconProps, 'icon'>) {
  return <LucideIcon icon={X} size={size} className={className} {...props} />
}

export function ChevronRightIcon({ size = 'lg', className, ...props }: Omit<LucideIconProps, 'icon'>) {
  return <LucideIcon icon={ChevronRight} size={size} className={className} {...props} />
}

export function ChevronLeftIcon({ size = 'lg', className, ...props }: Omit<LucideIconProps, 'icon'>) {
  return <LucideIcon icon={ChevronLeft} size={size} className={className} {...props} />
}

export function SparklesIcon({ size = 'sm', className, ...props }: Omit<LucideIconProps, 'icon'>) {
  return <LucideIcon icon={Sparkles} size={size} className={className} {...props} />
}

/**
 * Navigation Icon Toggle
 * 
 * DRY Principle: Consolidates menu/close toggle pattern
 */
export function NavigationToggle({
  isOpen,
  size = 'lg',
  className,
  ...props
}: {
  isOpen: boolean;
} & Omit<LucideIconProps, 'icon'> & React.ComponentProps<'svg'>) {
  return isOpen ? (
    <CloseIcon size={size} className={className} {...props} />
  ) : (
    <MenuIcon size={size} className={className} {...props} />
  );
}