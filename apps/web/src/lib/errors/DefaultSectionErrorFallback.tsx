'use client';

/**
 * Default Section Error Fallback Component
 *
 * User Experience: Clean, accessible error UI
 * Security: No sensitive information exposed
 * i18n: Accepts translations with fallback defaults
 */

import React from 'react';
import type { SectionErrorFallbackProps } from './types';
import { DEFAULT_SECTION_TRANSLATIONS } from './constants';

export function DefaultSectionErrorFallback({
  sectionId,
  sectionType,
  error,
  errorId,
  onRetry,
  retryCount,
  maxRetries,
  translations
}: SectionErrorFallbackProps) {
  const canRetry = retryCount < maxRetries;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Merge translations with defaults
  const t = { ...DEFAULT_SECTION_TRANSLATIONS, ...translations };

  return (
    <section
      className="section-error-fallback"
      style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'var(--error-bg-light, #fef2f2)',
        border: '1px solid var(--error-border-light, #fecaca)',
        borderRadius: '0.5rem',
        margin: '1rem 0'
      }}
      role="alert"
      aria-labelledby={`error-title-${errorId}`}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <ErrorTitle errorId={errorId} title={t.title} />
        <ErrorMessage message={t.message} canRetry={canRetry} canRetryText={t.canRetry} />

        {isDevelopment && (
          <DevelopmentErrorDetails
            sectionType={sectionType}
            sectionId={sectionId}
            error={error}
            errorId={errorId}
            retryCount={retryCount}
            maxRetries={maxRetries}
            detailsLabel={t.devDetails}
          />
        )}

        <ErrorActions
          canRetry={canRetry}
          onRetry={onRetry}
          tryAgainLabel={t.tryAgain}
          reloadLabel={t.reloadPage}
        />

        <HelpText text={t.persistHelp} />
      </div>
    </section>
  );
}

function ErrorTitle({ errorId, title }: { errorId: string; title: string }) {
  return (
    <h2
      id={`error-title-${errorId}`}
      style={{
        color: 'var(--error-text-primary, #dc2626)',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}
    >
      ⚠️ {title}
    </h2>
  );
}

function ErrorMessage({
  message,
  canRetry,
  canRetryText
}: {
  message: string;
  canRetry: boolean;
  canRetryText: string
}) {
  return (
    <p style={{
      color: 'var(--error-text-secondary, #374151)',
      marginBottom: '1.5rem',
      lineHeight: '1.5'
    }}>
      {message}
      {canRetry && ` ${canRetryText}`}
    </p>
  );
}

function DevelopmentErrorDetails({
  sectionType,
  sectionId,
  error,
  errorId,
  retryCount,
  maxRetries,
  detailsLabel,
}: {
  sectionType: string;
  sectionId: string;
  error: Error;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  detailsLabel: string;
}) {
  return (
    <details style={{
      backgroundColor: 'var(--error-bg-code, #f9fafb)',
      border: '1px solid var(--error-border-code, #d1d5db)',
      borderRadius: '0.25rem',
      padding: '1rem',
      marginBottom: '1.5rem',
      textAlign: 'left'
    }}>
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
        {detailsLabel}
      </summary>
      <pre style={{
        fontSize: '0.75rem',
        marginTop: '0.5rem',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        Section: {sectionType} ({sectionId}){'\n'}
        Error: {error.name}: {error.message}{'\n'}
        Error ID: {errorId}{'\n'}
        Retry Count: {retryCount}/{maxRetries}
      </pre>
    </details>
  );
}

function ErrorActions({
  canRetry,
  onRetry,
  tryAgainLabel,
  reloadLabel,
}: {
  canRetry: boolean;
  onRetry?: () => void;
  tryAgainLabel: string;
  reloadLabel: string;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      {canRetry && onRetry && (
        <ActionButton
          onClick={onRetry}
          variant="primary"
          label={`🔄 ${tryAgainLabel}`}
        />
      )}

      <ActionButton
        onClick={() => window.location.reload()}
        variant="secondary"
        label={`🔄 ${reloadLabel}`}
      />
    </div>
  );
}

function ActionButton({
  onClick,
  variant,
  label,
}: {
  onClick: () => void;
  variant: 'primary' | 'secondary';
  label: string;
}) {
  const isPrimary = variant === 'primary';
  const bgColor = isPrimary
    ? 'var(--error-button-primary, #3b82f6)'
    : 'var(--error-button-secondary, #6b7280)';
  const hoverColor = isPrimary
    ? 'var(--error-button-primary-hover, #2563eb)'
    : 'var(--error-button-secondary-hover, #4b5563)';

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
        color: 'white',
        border: 'none',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = hoverColor;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = bgColor;
      }}
    >
      {label}
    </button>
  );
}

function HelpText({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: '0.75rem',
      color: 'var(--error-button-secondary, #6b7280)',
      marginTop: '1.5rem'
    }}>
      {text}
    </p>
  );
}

export default DefaultSectionErrorFallback;
