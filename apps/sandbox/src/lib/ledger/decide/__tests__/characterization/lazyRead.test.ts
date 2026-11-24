// @vitest-environment happy-dom
/**
 * ⛑ LEDGER-CHAR-1 · lazyRead commands (where each command first reads state) against their goldens (plan P12 §4).
 */
import { vi } from 'vitest';
import { characterize, type Golden, type Manifest } from './compare';
import { lazyReadCases } from './cases/lazyRead';
import golden from './goldens/lazyRead.json';
import manifest from './goldens/manifest.json';

vi.mock('@/lib/ids', () => import('./mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) => import('./mocks').then((m) => m.banking(orig as never)));

characterize('lazyRead', lazyReadCases, golden as Golden, manifest as Manifest);
