'use client';

/**
 * Social Icon Component
 *
 * Uses custom SVG social icons — brand icons were permanently removed
 * from lucide-react due to trademark concerns.
 */

import React from 'react';
import {
  InstagramIcon,
  XIcon,
  YoutubeIcon,
  LinkedinIcon,
} from '@/components/UI/SocialIcons';
import styles from '../SiteFooter.module.css';

const IconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Instagram: InstagramIcon,
  X: XIcon,
  Youtube: YoutubeIcon,
  Linkedin: LinkedinIcon,
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
