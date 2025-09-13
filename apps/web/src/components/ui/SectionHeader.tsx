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
    title: 'header-title-sm',
    subtitle: 'header-subtitle-sm',
    description: 'header-description-sm',
    spacing: 'header-spacing-sm'
  },
  md: {
    title: 'header-title-md',
    subtitle: 'header-subtitle-md',
    description: 'header-description-md',
    spacing: 'header-spacing-md'
  },
  lg: {
    title: 'header-title-lg',
    subtitle: 'header-subtitle-lg',
    description: 'header-description-lg',
    spacing: 'header-spacing-lg'
  },
  xl: {
    title: 'header-title-xl',
    subtitle: 'header-subtitle-xl',
    description: 'header-description-xl',
    spacing: 'header-spacing-xl'
  }
} as const;

const alignmentClasses = {
  left: 'header-align-left',
  center: 'header-align-center',
  right: 'header-align-right'
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
          'header-title-base',
          sizeConfig.title,
          titleClassName
        )}
      >
        {title}
      </h2>
      
      {subtitle && (
        <p className={cn(
          'header-subtitle-base',
          sizeConfig.subtitle,
          subtitleClassName
        )}>
          {subtitle}
        </p>
      )}
      
      {description && (
        <p className={cn(
          'header-description-base',
          alignment === 'center' ? 'header-description-center' : 'header-description-left',
          sizeConfig.description,
          descriptionClassName
        )}>
          {description}
        </p>
      )}
    </div>
  );
}