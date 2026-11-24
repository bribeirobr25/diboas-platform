// @vitest-environment happy-dom
/**
 * ⛑ LEDGER-CHAR-1 · faults commands (a failed append in every appending row) against their goldens (plan P12 §4).
 */
import { vi } from 'vitest';
import { characterize, type Golden, type Manifest } from './compare';
import { faultCases } from './cases/faults';
import golden from './goldens/faults.json';
import manifest from './goldens/manifest.json';

vi.mock('@/lib/ids', () => import('./mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) => import('./mocks').then((m) => m.banking(orig as never)));

characterize('faults', faultCases, golden as Golden, manifest as Manifest);
