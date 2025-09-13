/**
 * DRY Principle: Reusable section header component
 * 
 * Eliminates duplicate heading patterns across sections
 * and provides consistent typography and spacing
 */

import { cn } from '@diboas/ui';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  alignment?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  descriptionClassName?: string;
  id?: string;
}

const sizeClasses = {
  sm: {
    title: 'text-2xl md:text-3xl',
    subtitle: 'text-lg md:text-xl',
    description: 'text-base',
    spacing: 'space-y-3'
  },
  md: {
    title: 'text-3xl md:text-4xl lg:text-5xl',
    subtitle: 'text-xl md:text-2xl',
    description: 'text-lg',
    spacing: 'space-y-4'
  },
  lg: {
    title: 'text-4xl md:text-5xl lg:text-6xl',
    subtitle: 'text-xl md:text-2xl lg:text-3xl',
    description: 'text-lg md:text-xl',
    spacing: 'space-y-6'
  },
  xl: {
    title: 'text-5xl md:text-6xl lg:text-7xl',
    subtitle: 'text-2xl md:text-3xl lg:text-4xl',
    description: 'text-xl md:text-2xl',
    spacing: 'space-y-8'
  }
} as const;

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
} as const;

export function SectionHeader({
  title,
  subtitle,
  description,
  alignment = 'center',
  size = 'md',
  className,
  titleClassName,
  subtitleClassName,
  descriptionClassName,
  id
}: SectionHeaderProps) {
  const sizeConfig = sizeClasses[size];
  const alignmentClass = alignmentClasses[alignment];

  return (
    <div className={cn(sizeConfig.spacing, alignmentClass, className)}>
      <h2
        id={id}
        className={cn(
          'font-bold text-neutral-900 leading-tight tracking-tight',
          sizeConfig.title,
          titleClassName
        )}
      >
        {title}
      </h2>
      
      {subtitle && (
        <p className={cn(
          'font-semibold text-primary-600',
          sizeConfig.subtitle,
          subtitleClassName
        )}>
          {subtitle}
        </p>
      )}
      
      {description && (
        <p className={cn(
          'text-neutral-600 leading-relaxed',
          alignment === 'center' ? 'max-w-3xl mx-auto' : 'max-w-3xl',
          sizeConfig.description,
          descriptionClassName
        )}>
          {description}
        </p>
      )}
    </div>
  );
}