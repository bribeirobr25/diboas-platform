'use client';

import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './Settlement.module.css';

const STEP_IDS = ['settlement.step1', 'settlement.step2', 'settlement.step3'] as const;

/**
 * The "where is my money" beat (UX-14 + UX-44): after approve, rehearse the
 * production settlement timeline (Submitted → Confirming → Confirmed) before
 * landing on the result. CLO honesty (load-bearing): explicitly labeled a
 * PRACTICE confirmation — it never implies a real on-chain event. Motion
 * respects prefers-reduced-motion (reduced motion collapses the delays). The
 * timers store their ids and clear on unmount (R-row effect contract); onComplete
 * rides a ref so the sequence runs once regardless of parent re-renders.
 */
export function Settlement({ onComplete }: { onComplete: () => void }) {
  // stage = index of the step currently confirming; steps before it are done.
  const [stage, setStage] = useState(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const beat = reduce ? 120 : 650;
    const timers = [
      setTimeout(() => setStage(1), beat),
      setTimeout(() => setStage(2), beat * 2),
      setTimeout(() => setStage(3), beat * 3),
      setTimeout(() => onCompleteRef.current(), beat * 3 + (reduce ? 150 : 550)),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={styles.wrap}>
      <p className={styles.badge}>
        <LucideIcon name="shield-check" size={14} />
        <FormattedMessage id="settlement.badge" />
      </p>
      <ol className={styles.steps} aria-live="polite">
        {STEP_IDS.map((id, i) => {
          const state = i < stage ? 'done' : i === stage ? 'active' : 'pending';
          return (
            <li key={id} className={styles.step} data-state={state}>
              <span className={styles.marker} aria-hidden>
                {state === 'done' ? <LucideIcon name="check" size={14} /> : null}
              </span>
              <FormattedMessage id={id} />
            </li>
          );
        })}
      </ol>
      <p className={styles.note}>
        <FormattedMessage id="settlement.note" />
      </p>
    </div>
  );
}
