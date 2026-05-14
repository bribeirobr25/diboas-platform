import { DisclaimerNote } from '@/components/UI/DisclaimerNote';

interface HostRegulatoryDisclaimerProps {
  text: string;
  className?: string;
}

/**
 * Host-owned regulatory disclaimer rendered on `/market`. Sits beside the
 * SDK's <ProductDisclaimer /> per docs/mvp §11 of the host-integration guide:
 * the product publisher (diBoaS Analytics) ships educational framing; the
 * platform host (diBoaS) attaches its own MiCA / CVM / FTC text relevant to
 * the audience for THIS host's locales. Lives in `components/Legal/` so it
 * survives the iteration-5 swap that deletes the mock SDK (rev-3 NF6).
 */
export function HostRegulatoryDisclaimer({ text, className }: HostRegulatoryDisclaimerProps) {
  return (
    <DisclaimerNote variant="projection" className={className}>
      {text}
    </DisclaimerNote>
  );
}
