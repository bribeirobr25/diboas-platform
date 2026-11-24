// @vitest-environment happy-dom
/**
 * ⛑ LEDGER-CHAR-1 · advanceTime commands (row 9) against their goldens (plan P12 §4).
 */
import { vi } from 'vitest';
import { characterize, type Golden, type Manifest } from './compare';
import { advanceTimeCases } from './cases/advanceTime';
import golden from './goldens/advanceTime.json';
import manifest from './goldens/manifest.json';

vi.mock('@/lib/ids', () => import('./mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) => import('./mocks').then((m) => m.banking(orig as never)));

/* Long histories replay hundreds of days in six runs per case (two clocks × three zones):
   each case gets its own budget instead of a raised suite default (`5.397`). */
characterize('advanceTime', advanceTimeCases, golden as Golden, manifest as Manifest, {
  timeoutMs: 30_000,
});
