'use client';

/**
 * Social Icon Component
 *
 * Uses centralized LucideIcon exports — no direct lucide-react imports.
 */

import {
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  type LucideIconType,
} from '@/components/UI/LucideIcon';
import styles from '../SiteFooter.module.css';

const IconComponents: Record<string, LucideIconType> = {
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
};

interface SocialIconProps {
  iconName: string;
  label: string;
  href: string;
}

export function SocialIcon({ iconName, label, href }: SocialIconProps) {
  const Icon = IconComponents[iconName];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.socialLink}
      aria-label={label}
    >
      {Icon ? (
        <Icon className={styles.socialIcon} aria-hidden="true" />
      ) : (
        <span className={styles.socialFallback}>
          {iconName.charAt(0).toUpperCase()}
        </span>
      )}
    </a>
  );
}
