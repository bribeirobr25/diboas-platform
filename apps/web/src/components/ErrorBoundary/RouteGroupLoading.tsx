/**
 * Shared Route Group Loading UI
 *
 * Server component - renders a centered loading spinner while
 * page components are being fetched via React Suspense.
 * Each route group's loading.tsx re-exports this component.
 */

export function RouteGroupLoading() {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          border: '3px solid var(--brand-primary-light, #e0e7ff)',
          borderTopColor: 'var(--brand-primary, #3b82f6)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
        role="status"
        aria-busy="true"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
