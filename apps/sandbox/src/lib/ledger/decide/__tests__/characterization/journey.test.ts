// @vitest-environment happy-dom
/**
 * ⛑ LEDGER-CHAR-1 · journey commands (rows 1–8, 10–12) against their goldens (plan P12 §4).
 */
import { vi } from 'vitest';
import { characterize, type Golden, type Manifest } from './compare';
import { journeyCases } from './cases/journey';
import golden from './goldens/journey.json';
import manifest from './goldens/manifest.json';

vi.mock('@/lib/ids', () => import('./mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) => import('./mocks').then((m) => m.banking(orig as never)));

characterize('journey', journeyCases, golden as Golden, manifest as Manifest);
