/**
 * ToolPage — generic page shell for /tools/* routes.
 *
 * Server component. Composes:
 *   - localized hero (kicker + headline + subtitle)
 *   - the per-tool calculator (passed as children, client component)
 *   - optional vignette block (per §6C.3 — retirement etc.)
 *   - lesson cross-link
 *   - "Try other tools" cross-links
 *
 * Each tool's page.tsx (~30 LoC target) provides only the calculator child
 * + the pre-resolved page-namespace messages; this wrapper resolves all
 * surrounding copy via TOOL_DESCRIPTORS[toolKey].i18nNamespace.
 *
 * Adelaide attribution moved to the surrounding tools/layout.tsx header
 * strip per §6C.1 plan ("shared header/Adelaide attribution").
 */

import { LocaleLink } from '@/components/UI/LocaleLink';
import { TOOL_DESCRIPTORS, type ToolKey } from '@/lib/tools';
import styles from './ToolPage.module.css';

interface ToolPageProps {
  toolKey: ToolKey;
  /** Pre-resolved page-namespace messages (server-side loaded). */
  pageMessages: Record<string, string>;
  children: React.ReactNode;
}

export function ToolPage({ toolKey, pageMessages, children }: ToolPageProps) {
  const namespace = TOOL_DESCRIPTORS[toolKey].i18nNamespace;
  const get = (k: string, fallback = ''): string => pageMessages[k] ?? fallback;

  const lessonHref = get(`${namespace}.lessonLink.href`, '/learn/compound-interest');
  const vignetteSubtitle = get(`${namespace}.vignette.subtitle`);

  return (
    <main className={styles.page} data-tool={toolKey}>
      <header className={styles.hero}>
        <p className={styles.kicker}>{get(`${namespace}.hero.kicker`)}</p>
        <h1 className={styles.headline}>{get(`${namespace}.hero.headline`)}</h1>
        <p className={styles.subtitle}>{get(`${namespace}.hero.subtitle`)}</p>
      </header>

      <section className={styles.calculatorSection}>{children}</section>

      {vignetteSubtitle && (
        <aside className={styles.vignette} aria-label="Tool framing">
          <p className={styles.vignetteSubtitle}>{vignetteSubtitle}</p>
        </aside>
      )}

      <p className={styles.disclaimer}>{get('tools-shared.disclaimer')}</p>

      <aside
        className={styles.lessonCallout}
        aria-label={get(`${namespace}.lessonLink.label`)}
      >
        <span className={styles.lessonCalloutLabel}>
          {get(`${namespace}.lessonLink.label`)}
        </span>
        <LocaleLink href={lessonHref} className={styles.lessonCalloutLink}>
          {get(`${namespace}.lessonLink.linkText`)}
        </LocaleLink>
      </aside>

      <footer className={styles.footer}>
        <LocaleLink href="/tools" className={styles.footerLink} prefetch={false}>
          {get('tools-shared.footer.tryOtherTools')}
        </LocaleLink>
      </footer>
    </main>
  );
}
