'use client';

/**
 * Path Selector Screen (Screen 2)
 *
 * User selects their investment path: Safety, Balance, or Growth
 * WCAG 2.2 Compliant: Uses radiogroup pattern for selection
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: No inline translation helpers
 */

import React, { useCallback, useRef } from 'react';
import { useDreamMode } from '../DreamModeProvider';
import { useDreamModeTranslation } from '../hooks';
import { PATH_CONFIGS, type DreamPath } from '@/lib/dream-mode';
import { PathIcon, AlertTriangleIcon, type PathIconType } from '@/components/Icons';
import styles from './screens.module.css';

const PATH_ORDER: DreamPath[] = ['safety', 'balance', 'growth'];

export function PathSelectorScreen() {
  const { t: tDreamMode, getTranslator } = useDreamModeTranslation();
  const { selectPath, previousScreen, state } = useDreamMode();
  const selectedPath = state.selectedPath;
  const pathRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const t = getTranslator('paths');
  const tInput = getTranslator('input');

  const handleSelectPath = (path: DreamPath) => {
    selectPath(path);
  };

  // Keyboard navigation for radiogroup pattern
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % PATH_ORDER.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + PATH_ORDER.length) % PATH_ORDER.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = PATH_ORDER.length - 1;
        break;
      default:
        return;
    }

    pathRefs.current[newIndex]?.focus();
  }, []);

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Headline */}
        <h2 className={styles.headline} id="path-selector-heading">{t('headline')}</h2>
        <p className={styles.subhead} id="path-selector-description">{t('subhead')}</p>

        {/* Path cards - WCAG 2.2 radiogroup pattern */}
        <div
          className={styles.pathGrid}
          role="radiogroup"
          aria-labelledby="path-selector-heading"
          aria-describedby="path-selector-description"
        >
          {PATH_ORDER.map((pathId, index) => {
            const config = PATH_CONFIGS[pathId];
            const isSelected = selectedPath === pathId;
            const pathName = t(`${pathId}.name`);
            const pathDescription = t(`${pathId}.description`);
            const pathRisk = t(`${pathId}.risk`);

            return (
              <button
                key={pathId}
                ref={(el) => { pathRefs.current[index] = el; }}
                onClick={() => handleSelectPath(pathId)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={styles.pathCard}
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`path-${pathId}`}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${pathName}: ${pathDescription}`}
                tabIndex={isSelected || (!selectedPath && index === 0) ? 0 : -1}
              >
                <span className={styles.pathIcon} aria-hidden="true"><PathIcon type={pathId as PathIconType} size={28} /></span>
                <h3 className={styles.pathName}>
                  {pathName}
                </h3>
                <p className={styles.pathDescription}>
                  {pathDescription}
                </p>
                <div className={styles.pathRisk}>
                  <span className={styles.pathRiskLabel}>
                    {pathRisk}
                  </span>
                  {config.warning && (
                    <span className={styles.pathWarning} aria-label={t('warningLabel')}><AlertTriangleIcon size={16} /></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Back button */}
        <button onClick={previousScreen} className={styles.backButton}>
          <ChevronLeftIcon />
          {tInput('back')}
        </button>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
