'use client';

import { useRef, useCallback } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { AlertIcon, ExternalLinkIcon, CloseIcon } from './Icons';
import styles from '../styles/ExportModal.module.css';

interface ExportKeyModalProps {
  onClose: () => void;
  t: (key: string) => string;
}

/** Export Key Modal — matches original demo exactly */
export function ExportKeyModal({ onClose, t }: ExportKeyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, true, { returnFocus: true });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div className={styles.exportModalOverlay} onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className={styles.exportModalContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('preDemo.wallet.exportModalTitle')}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.exportModalHeader}>
          <h2 className={styles.exportModalTitle}>{t('preDemo.wallet.exportModalTitle')}</h2>
          <button onClick={onClose} className={styles.exportModalClose} aria-label={t('preDemo.common.back')}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.exportModalBody}>
          <p className={styles.exportModalText}>
            {t('preDemo.wallet.exportModalDesc1Prefix')}
            <strong>{t('preDemo.wallet.exportModalDesc1Bold')}</strong>
            {t('preDemo.wallet.exportModalDesc1Suffix')}
          </p>
          <p className={styles.exportModalText}>
            <strong>{t('preDemo.wallet.exportModalDesc2Bold')}</strong>
            {t('preDemo.wallet.exportModalDesc2Suffix')}
          </p>

          {/* Amber info box */}
          <div className={styles.exportModalAmberBox}>
            <p className={styles.exportModalAmberTitle}>
              {t('preDemo.wallet.exportModalStepsTitle')}
            </p>
            <ol className={styles.exportModalSteps}>
              <li>{t('preDemo.wallet.exportModalStep1')}</li>
              <li>{t('preDemo.wallet.exportModalStep2')}</li>
              <li>{t('preDemo.wallet.exportModalStep3')}</li>
            </ol>
          </div>

          {/* Red warning box */}
          <div className={styles.exportModalRedBox}>
            <p className={styles.exportModalWarningText}>
              <AlertIcon />
              <span>
                <strong>{t('preDemo.wallet.exportModalWarningLabel')}</strong>
                {t('preDemo.wallet.exportModalWarningBody')}
              </span>
            </p>
          </div>
        </div>

        {/* CTA button (disabled in demo) */}
        <button disabled className={styles.exportModalButton}>
          <ExternalLinkIcon />
          {t('preDemo.wallet.exportModalButton')}
          <span className={styles.exportModalButtonDemo}>{t('preDemo.wallet.exportModalButtonDemo')}</span>
        </button>

        <p className={styles.exportModalFooter}>
          {t('preDemo.wallet.exportModalFooter')}
        </p>
      </div>
    </div>
  );
}
