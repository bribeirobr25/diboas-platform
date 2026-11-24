// @vitest-environment happy-dom
/**
 * ⛑ LEDGER-CHAR-1 · rulesCreditsSim commands (rows 13–19) against their goldens (plan P12 §4).
 */
import { vi } from 'vitest';
import { characterize, type Golden, type Manifest } from './compare';
import { rulesCreditsSimCases } from './cases/rulesCreditsSim';
import golden from './goldens/rulesCreditsSim.json';
import manifest from './goldens/manifest.json';

vi.mock('@/lib/ids', () => import('./mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) => import('./mocks').then((m) => m.banking(orig as never)));

characterize('rulesCreditsSim', rulesCreditsSimCases, golden as Golden, manifest as Manifest);
