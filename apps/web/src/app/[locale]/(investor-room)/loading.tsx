export default function InvestorRoomLoading() {
  return (
    <div
      style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}
      role="status"
      aria-live="polite"
    >
      <span style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
    </div>
  );
}
