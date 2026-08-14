import { Consent } from '@/components/Consent';

/**
 * The consent surface (A3; W-3). Ungated preview route (outside `(app)`). The
 * Accept + opt-ins call the consent seam; the server-authoritative write
 * (D1/G11 schema) is wired at the end. No-op handler until then.
 */
export default function ConsentPage() {
  return <Consent />;
}
