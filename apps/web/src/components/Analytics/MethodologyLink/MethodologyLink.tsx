import styles from './MethodologyLink.module.css';

interface MethodologyLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function MethodologyLink({ href, children, className }: MethodologyLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.link} ${className ?? ''}`}
    >
      {children}
      <span aria-hidden="true">&nbsp;↗</span>
    </a>
  );
}
