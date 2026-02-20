import type { ChainId } from '@/lib/pre-demo';

/** Branded chain SVG icons matching the original demo */
export function ChainSvgIcon({ chain }: { chain: ChainId }) {
  switch (chain) {
    case 'SOL':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <defs>
            <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <path fill="url(#solGrad)" d="M4.5 16.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5zm2.3-5.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5l2.3-2.3zm12.5-4l-2.3 2.3c-.1.1-.3.2-.4.2H4.3c-.3 0-.4-.3-.2-.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5z" />
        </svg>
      );
    case 'BTC':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#F7931A" />
          <path fill="white" d="M15.3 10.5c.2-1.2-.7-1.8-2-2.2l.4-1.6-1-.3-.4 1.5c-.3-.1-.5-.1-.8-.2l.4-1.5-1-.3-.4 1.6c-.2-.1-.4-.1-.6-.2l-1.4-.3-.3 1.1s.7.2.7.2c.4.1.5.4.5.6l-.5 2.1c0 0 .1 0 .1 0l-.1 0-.7 2.9c-.1.2-.2.4-.6.3 0 0-.7-.2-.7-.2l-.5 1.2 1.3.3c.2.1.5.1.7.2l-.4 1.6 1 .3.4-1.6c.3.1.5.2.8.2l-.4 1.6 1 .3.4-1.6c1.7.3 2.9.2 3.4-1.3.4-1.2 0-1.9-.9-2.4.7-.2 1.2-.6 1.3-1.5zm-2.3 3.3c-.3 1.2-2.3.6-3 .4l.5-2.1c.7.2 2.8.5 2.5 1.7zm.3-3.3c-.3 1.1-1.9.5-2.5.4l.5-1.9c.6.1 2.3.4 2 1.5z" />
        </svg>
      );
    case 'ETH':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#627EEA" />
          <path fill="white" fillOpacity="0.6" d="M12 4v6l5 2.5z" />
          <path fill="white" d="M12 4l-5 8.5 5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M12 15.5v4.5l5-7z" />
          <path fill="white" d="M12 15.5l-5-2.5 5 7z" />
          <path fill="white" fillOpacity="0.2" d="M12 14.5l5-2.5-5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M7 12l5 2.5v-5z" />
        </svg>
      );
    case 'SUI':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#4DA2FF" />
          <path fill="white" d="M12 6c-2.5 0-4.5 2-4.5 4.5 0 1.5.7 2.8 1.8 3.6l2.2 2.2c.3.3.7.3 1 0l2.2-2.2c1.1-.8 1.8-2.1 1.8-3.6C16.5 8 14.5 6 12 6zm0 7c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z" />
        </svg>
      );
    case 'TRX':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="#FF0013" />
          <path fill="white" d="M7 7l10 0-5 11z" />
          <path fill="#FF0013" d="M8.5 8l3.5 3.5 3.5-3.5z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Branded L2 chain icons (16x16) */
export function L2ChainIcon({ l2Id, color }: { l2Id: string; color: string }) {
  switch (l2Id) {
    case 'ARB':
      return (
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="7" fill={color} />
          <path fill="white" d="M8 3.5l-3.5 7h2l1.5-3 1.5 3h2z" />
        </svg>
      );
    case 'BASE':
      return (
        <svg viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="7" fill={color} />
          <path fill="white" d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4 4-1.8 4-4H8V4z" />
        </svg>
      );
    default:
      return null;
  }
}
