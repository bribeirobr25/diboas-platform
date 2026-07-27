import { LucideIcon, ArrowUpRight } from '@/components/UI/LucideIcon';
import styles from './MethodologyLink.module.css';

interface MethodologyLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /**
   * When true, render a non-interactive "coming soon" label instead of a link —
   * used while the diBoaS Analytics site is not yet public. No href is emitted,
   * so users are never led to an unlaunched page.
   */
  comingSoon?: boolean;
}

export function MethodologyLink({ href, children, className, comingSoon }: MethodologyLinkProps) {
  if (comingSoon) {
    return <span className={`${styles.comingSoon} ${className ?? ''}`}>{children}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.link} ${className ?? ''}`}
    >
      {children}
      <LucideIcon icon={ArrowUpRight} size="xs" className={styles.externalIcon} />
    </a>
  );
}
