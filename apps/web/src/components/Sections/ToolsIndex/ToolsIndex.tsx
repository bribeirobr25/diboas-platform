/**
 * ToolsIndex — purpose-grouped landing for /tools (per Q9 Option B).
 *
 * Renders 4 sections (grow / protect / target / business) keyed by user
 * intent rather than tier. Sections with no shipped tools yet are simply
 * not rendered. v1 ships Tier-1 cards; 6D adds protect/target tools, 6E
 * adds business tools.
 */

import { LocaleLink } from '@/components/UI/LocaleLink';
import { CinematicHeroFactory } from '@/components/Sections/CinematicHero';
import {
  Palmtree,
  ShieldCheck,
  TrendingUp,
  LineChart,
  AlertTriangle,
  Globe,
  Target,
  BarChart3,
  Award,
  History,
} from '@/components/UI/LucideIcon';
import { TOOL_DESCRIPTORS, type ToolKey, type ToolSectionKey } from '@/lib/tools';
import styles from './ToolsIndex.module.css';

interface ToolsIndexProps {
  locale: string;
  /** Set of tool keys that should appear in the landing (allows progressive rollout). */
  shippedTools: ReadonlyArray<ToolKey>;
  /** Optional `?for=business` filter; when 'business', only the business section renders. */
  audienceFilter?: 'business' | null;
  /** Pre-resolved i18n strings — server component receives flat key/value map. */
  copy: {
    heroKicker: string;
    heroHeadline: string;
    heroSubtitle: string;
    sections: Record<ToolSectionKey, { title: string; question: string }>;
    /** Per-tool card copy keyed by ToolKey. */
    cards: Partial<Record<ToolKey, { title: string; tagline: string }>>;
    /** Filter chip labels (Phase 6E.tools-page-integration). */
    filterChip: { all: string; business: string; ariaLabel: string };
  };
}

const SECTION_ORDER: ReadonlyArray<ToolSectionKey> = ['grow', 'protect', 'target', 'business'];

const ICON_MAP = {
  compound: LineChart,
  retirement: Palmtree,
  emergency: ShieldCheck,
  goal: TrendingUp,
  inflation: AlertTriangle,
  timeToTarget: Target,
  currencyDepreciation: Globe,
  cardFees: BarChart3,
  idleCash: Award,
  assetHistory: History,
} as const;

export function ToolsIndex({ shippedTools, audienceFilter, copy }: ToolsIndexProps) {
  const visibleSections = SECTION_ORDER.filter((section) => {
    if (audienceFilter === 'business' && section !== 'business') return false;
    return shippedTools.some((key) => TOOL_DESCRIPTORS[key].section === section);
  });

  const hasBusinessTools = shippedTools.some((key) => TOOL_DESCRIPTORS[key].section === 'business');

  return (
    <main className={styles.page}>
      <CinematicHeroFactory
        scene="particles"
        theme="lighter"
        align="center"
        sectionId="hero-tools"
        eyebrow={copy.heroKicker}
        headline={copy.heroHeadline}
        subheadline={copy.heroSubtitle}
        priority
      />

      {/* The hero is full-bleed; the rest of the page stays in a centred,
          width-capped column (the hero owns its own internal container). */}
      <div className={styles.body}>
        {hasBusinessTools && (
          <nav className={styles.filterChips} aria-label={copy.filterChip.ariaLabel}>
            <LocaleLink
              href="/tools"
              className={audienceFilter === null ? styles.filterChipActive : styles.filterChip}
              prefetch={false}
              aria-current={audienceFilter === null ? 'page' : undefined}
            >
              {copy.filterChip.all}
            </LocaleLink>
            <LocaleLink
              href="/tools?for=business"
              className={audienceFilter === 'business' ? styles.filterChipActive : styles.filterChip}
              prefetch={false}
              aria-current={audienceFilter === 'business' ? 'page' : undefined}
            >
              {copy.filterChip.business}
            </LocaleLink>
          </nav>
        )}

        {/* A16/O-2: `data-section-id` makes the tool-card area observable by the
            global ScrollDepthTracker (landing layout), which emits
            `section_viewed` — uniform with every other section impression. */}
        <div className={styles.sections} data-section-id="tool_cards">
          {visibleSections.map((section) => {
          const sectionTools = shippedTools.filter(
            (key) => TOOL_DESCRIPTORS[key].section === section
          );
          if (sectionTools.length === 0) return null;
          return (
            <section key={section} className={styles.section} data-section={section}>
              <h2 className={styles.sectionTitle}>{copy.sections[section].title}</h2>
              <p className={styles.sectionQuestion}>{copy.sections[section].question}</p>
              <div className={styles.cardGrid}>
                {sectionTools.map((toolKey) => {
                  const card = copy.cards[toolKey];
                  if (!card) return null;
                  const descriptor = TOOL_DESCRIPTORS[toolKey];
                  const Icon = ICON_MAP[descriptor.icon];
                  return (
                    <LocaleLink
                      key={toolKey}
                      href={`/tools/${descriptor.slug}`}
                      className={styles.card}
                      prefetch={false}
                    >
                      <span className={styles.cardIcon}>
                        <Icon size={28} strokeWidth={2} />
                      </span>
                      <span className={styles.cardTitle}>{card.title}</span>
                      <span className={styles.cardTagline}>{card.tagline}</span>
                    </LocaleLink>
                  );
                })}
              </div>
            </section>
          );
          })}
        </div>
      </div>
    </main>
  );
}
