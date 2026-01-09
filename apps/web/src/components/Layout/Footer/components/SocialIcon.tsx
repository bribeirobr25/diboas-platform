'use client';

/**
 * Social Icon Component
 *
 * Dynamically loaded social media icons with fallback
 */

import { useState, useEffect } from 'react';
import styles from '../SiteFooter.module.css';

// Dynamic icon imports for better performance
const IconComponents = {
  Instagram: () => import('lucide-react').then(mod => mod.Instagram),
  Twitter: () => import('lucide-react').then(mod => mod.Twitter),
  Youtube: () => import('lucide-react').then(mod => mod.Youtube),
  Linkedin: () => import('lucide-react').then(mod => mod.Linkedin),
};

interface SocialIconProps {
  iconName: string;
  label: string;
  href: string;
}

export function SocialIcon({ iconName, label, href }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.socialLink}
      aria-label={label}
    >
      <SocialIconRenderer iconName={iconName} />
    </a>
  );
}

function SocialIconRenderer({ iconName }: { iconName: string }) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<{ className?: string }> | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        if (iconName in IconComponents) {
          const Component = await IconComponents[iconName as keyof typeof IconComponents]();
          setIconComponent(() => Component);
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      }
    };

    loadIcon();
  }, [iconName]);

  if (hasError || !IconComponent) {
    return (
      <span className={styles.socialFallback}>
        {iconName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return <IconComponent className={styles.socialIcon} />;
}
