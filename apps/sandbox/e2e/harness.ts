/**
 * Q0 · the sandbox browser harness. Three capabilities the P8c two-tab scenarios
 * (V3–V8) and B6 need, and nothing more:
 *
 *   1 · MULTI-PAGE, ONE CONTEXT   `tabs(n)` — n pages sharing one origin's cookies and
 *                                 storage, i.e. one user with several tabs open. These are
 *                                 Playwright pages: focus-emulated, so ALWAYS visible and
 *                                 focused — they cannot model a background tab.
 *   2 · CDP LIFECYCLE             `setLifecycle(page, 'frozen' | 'active')` — the
 *                                 browser's own tab freezing (Page.setWebLifecycleState),
 *                                 on tabs from the `freezable` fixture only (see
 *                                 `launchFreezableBrowser`). Those tabs share one window,
 *                                 so they also model background tabs.
 *   3 · BUILD SWAP, ONE ORIGIN    `server.swapBuild(dir?)` — stop, put another production
 *                                 build in place, restart on the SAME origin while tabs
 *                                 stay open; i.e. a deploy under a running tab.
 *
 * The server environment is HERMETIC: `next start` also loads `.env.local`, which on a
 * developer machine can point at a real database or carry a provider key. Every key the
 * app reads is pinned here (`@next/env` never overwrites a key the process already has,
 * empty included); empty means "the code's default", so a local run and a CI run test
 * the same app.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';

const APP_DIR = join(__dirname, '..');
const DIST = join(APP_DIR, '.next');
/** Where the original build waits while a swapped-in one is served. */
const HELD = join(APP_DIR, '.next.e2e-held');
const PORT = Number(process.env.SANDBOX_E2E_PORT ?? '3102');
const NEXT_BIN = createRequire(join(APP_DIR, 'package.json')).resolve('next/dist/bin/next');

const HERMETIC_ENV: Record<string, string> = {
  NODE_ENV: 'production',
  SANDBOX_PUBLIC_ACCESS: 'true',
  SANDBOX_ACCESS_PASSWORD: '',
  SANDBOX_GATE_ALLOW_INSECURE: '',
  DATABASE_URL: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
  SANDBOX_EVIDENCE_PERSISTENCE: '',
  PRACTICE_ACCOUNTS_ENABLED: '',
  REAL_PARITY_INTERNAL: '',
  SANDBOX_MODE_PALETTE: '',
  // Empty = the code's default: the geofence stays ON (it only blocks on a geo header).
  SANDBOX_GEO_ENABLED: '',
  SANDBOX_GEO_OVERRIDE: '',
  VERCEL_ENV: '',
  DEV_ALLOWED_ORIGINS: '',
  // No external market fetches from a test run: the kill switch takes source ids
  // (`lib/market/killSwitch.ts`), and no provider key reaches the server.
  MARKET_SOURCES_DISABLED: 'defillama,coingecko',
  COINGECKO_API_KEY: '',
};

/** Resolves after `ms`, or never if `signal` fires first — the timer is always cleared (R-1). */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => clearTimeout(id), { once: true });
  });
}

/** `promise` if it settles within `ms`, else `false`; the losing timer is cleared. */
async function within<T>(promise: Promise<T>, ms: number): Promise<T | false> {
  const cancel = new AbortController();
  try {
    return await Promise.race([promise, delay(ms, cancel.signal).then(() => false as const)]);
  } finally {
    cancel.abort();
  }
}

async function waitFor(
  check: () => Promise<boolean>,
  ms: number,
  what: () => string
): Promise<void> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(250);
  }
  throw new Error(`timed out after ${ms} ms: ${what()}`);
}

/**
 * Process groups this worker started. A worker that is killed outright (second Ctrl-C,
 * a teardown timeout) runs no fixture `finally`, so a sync exit hook takes them down —
 * otherwise the next run finds the port taken and Chrome orphaned with its profile.
 */
const OWNED_GROUPS = new Set<number>();
process.once('exit', () => {
  for (const pid of OWNED_GROUPS) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      /* already gone */
    }
  }
});

/** Spawn in an own process group, tracked for the exit hook; `failed` settles on a spawn error. */
function spawnGroup(command: string, args: string[], options: Parameters<typeof spawn>[2]) {
  const child = spawn(command, args, { ...options, detached: true });
  let spawnError: Error | null = null;
  const exited = new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
    child.once('error', (error) => {
      spawnError = error;
      resolve();
    });
  });
  if (child.pid !== undefined) OWNED_GROUPS.add(child.pid);
  void exited.then(() => {
    if (child.pid !== undefined) OWNED_GROUPS.delete(child.pid);
  });
  const signal = (sig: NodeJS.Signals) => {
    if (child.pid === undefined) return;
    try {
      process.kill(-child.pid, sig);
    } catch {
      /* already gone */
    }
  };
  /**
   * SIGTERM the group; SIGKILL it if it has not exited within 10 s. A step that slow is
   * reported, not hidden: a teardown that outlives Playwright's fixture timeout gets the
   * worker killed, and a killed worker restores nothing (`HARNESS-1`).
   */
  const terminate = async () => {
    if (child.exitCode !== null || child.signalCode !== null || spawnError) return;
    signal('SIGTERM');
    if (
      (await within(
        exited.then(() => true),
        10_000
      )) === false
    ) {
      console.warn(`[harness] ${command} (pid ${child.pid}) ignored SIGTERM for 10 s — SIGKILL`);
      signal('SIGKILL');
      if (
        (await within(
          exited.then(() => true),
          10_000
        )) === false
      )
        throw new Error(`pid ${child.pid} survived SIGKILL for 10 s`);
    }
  };
  return {
    child,
    exited,
    terminate,
    /** Exited (or never started) — what the readiness wait must stop on. */
    gone: () => spawnError !== null || child.exitCode !== null || child.signalCode !== null,
    spawnError: () => spawnError,
  };
}

class SandboxServer {
  readonly origin = `http://127.0.0.1:${PORT}`;
  /** BUILD_ID of the build currently served — read from disk at each start. */
  buildId = '';
  /** How many times this server has started, and the pid of the current process. */
  starts = 0;
  pid: number | undefined;
  private proc: ReturnType<typeof spawnGroup> | null = null;
  private output = '';
  /** The directory a swapped-in build came from, so `restoreBuild` can put it back. */
  private swappedFrom: string | null = null;

  /** Anything answering on the port (used to refuse a foreign server and to see it stop). */
  async isUp(): Promise<boolean> {
    try {
      const res = await fetch(`${this.origin}/api/health`, { signal: AbortSignal.timeout(2_000) });
      return res.status > 0;
    } catch {
      return false;
    }
  }

  /** The sandbox's own health answer — not merely something on the port. */
  private async isSandbox(): Promise<boolean> {
    try {
      const res = await fetch(`${this.origin}/api/health`, { signal: AbortSignal.timeout(2_000) });
      return ((await res.json()) as { app?: string }).app === 'sandbox';
    } catch {
      return false;
    }
  }

  async start(): Promise<void> {
    // Fail closed: never test whatever happens to be listening on the port.
    if (await this.isUp())
      throw new Error(`port ${PORT} already answers — refusing to test an unknown server`);
    if (!existsSync(join(DIST, 'BUILD_ID')))
      throw new Error(
        'no sandbox production build — run `pnpm exec turbo run build --filter=sandbox...` first'
      );
    this.buildId = readFileSync(join(DIST, 'BUILD_ID'), 'utf8').trim();
    this.output = '';
    const proc = spawnGroup(
      process.execPath,
      [NEXT_BIN, 'start', '-p', String(PORT), '-H', '127.0.0.1'],
      { cwd: APP_DIR, env: { ...process.env, ...HERMETIC_ENV }, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    this.proc = proc;
    const keep = (chunk: Buffer) => {
      this.output = (this.output + chunk.toString()).slice(-8_000);
    };
    proc.child.stdout?.on('data', keep);
    proc.child.stderr?.on('data', keep);
    try {
      await waitFor(
        async () => {
          // A server that died (EADDRINUSE, a crash) must not be waited on for 60 s —
          // nor mistaken for whatever then answers on the port.
          if (proc.gone()) throw new Error(`next start exited early\n${this.output}`);
          return this.isSandbox();
        },
        60_000,
        () => `sandbox server on :${PORT}\n${this.output}`
      );
    } catch (error) {
      await this.stop();
      throw error;
    }
    this.starts += 1;
    this.pid = proc.child.pid;
  }

  async stop(): Promise<void> {
    const proc = this.proc;
    if (!proc) return;
    this.proc = null;
    this.pid = undefined;
    await proc.terminate();
    proc.child.stdout?.removeAllListeners('data');
    proc.child.stderr?.removeAllListeners('data');
    await waitFor(
      async () => !(await this.isUp()),
      15_000,
      () => `port ${PORT} to be released`
    );
  }

  /** The last server output, for a failing test's report. */
  log(): string {
    return this.output;
  }

  /**
   * A deploy under running tabs: stop, put `nextDistDir` in place of `.next`, restart
   * on the same origin. With no directory the SAME build restarts — a restart-only
   * swap. Restored by `restoreBuild`. Renames, never copies, so the directory must be
   * on the same filesystem as `apps/sandbox`; a failed second rename is rolled back.
   */
  async swapBuild(nextDistDir?: string): Promise<void> {
    if (nextDistDir) {
      if (this.swappedFrom) throw new Error('a build is already swapped in — restore it first');
      const dir = resolve(nextDistDir);
      if (!existsSync(join(dir, 'BUILD_ID'))) throw new Error(`${dir} is not a production build`);
      const real = realpathSync(dir);
      if (real === realpathSync(DIST) || real === HELD)
        throw new Error(`${dir} is the served build itself — swap in a different directory`);
      if (statSync(dir).dev !== statSync(APP_DIR).dev)
        throw new Error(
          `${dir} is on another filesystem than ${APP_DIR} — a rename cannot move it`
        );
      await this.stop();
      renameSync(DIST, HELD);
      try {
        renameSync(dir, DIST);
      } catch (error) {
        renameSync(HELD, DIST);
        throw error;
      }
      this.swappedFrom = dir;
    } else {
      await this.stop();
    }
    await this.start();
  }

  /** Put the original build back where it was. Safe to call when nothing is swapped. */
  async restoreBuild(): Promise<void> {
    if (!this.swappedFrom) return;
    await this.stop();
    renameSync(DIST, this.swappedFrom);
    renameSync(HELD, DIST);
    this.swappedFrom = null;
  }
}

/**
 * A browser whose tabs CAN be frozen.
 *
 * Playwright enables Chrome's focus emulation on every page it opens, and Chrome treats
 * a focus-emulated page as captured: it is never hidden, and Chrome never freezes a
 * visible page. `Page.setWebLifecycleState` then answers `{}` and does nothing
 * (measured 2026-10-17, Chrome 155 and Chromium 153: timers keep ticking, no `freeze`
 * event; the same command on raw CDP with focus emulation off freezes the page). The
 * documented opt-out is `connectOverCDP(endpoint, { noDefaults: true })`, which skips
 * the default overrides for the browser's DEFAULT context only.
 *
 * So this starts Chrome itself on a throwaway profile, attaches over CDP, and hands out
 * pages from that default context. It carries Playwright's isolation and timer switches
 * (below) — NOT the project's device settings (viewport, user agent) nor Playwright's
 * `--disable-features` list, so a test that depends on those does not belong here.
 * Never connect by channel name: that resolves to the user's real Chrome profile.
 */
const CHROME_SWITCHES = [
  '--headless',
  '--remote-debugging-port=0',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-field-trial-config',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-back-forward-cache',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-search-engine-choice-screen',
  '--metrics-recording-only',
  '--password-store=basic',
  '--use-mock-keychain',
  // Playwright's own default (`chromiumSandbox: false`); this browser only ever loads
  // the harness's 127.0.0.1 server.
  '--no-sandbox',
];

/** The stable Chrome the CI job uses (`channel: 'chrome'`); `SANDBOX_E2E_CHROME` overrides. */
function chromeExecutable(): string {
  const path =
    process.env.SANDBOX_E2E_CHROME ??
    {
      darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      linux: '/usr/bin/google-chrome',
    }[process.platform as 'darwin' | 'linux'];
  if (!path || !existsSync(path))
    throw new Error(
      `no Google Chrome at ${path ?? `(${process.platform})`} — set SANDBOX_E2E_CHROME`
    );
  return path;
}

interface FreezableBrowser {
  /** The browser's default context: one user, shared storage, no focus emulation. */
  readonly context: BrowserContext;
  /**
   * n tabs in that one context — tabs of ONE window, as a user has them: only the
   * front tab paints, so `bringToFront()` a tab before acting in it.
   */
  tabs(n: number): Promise<Page[]>;
  close(): Promise<void>;
}

async function launchFreezableBrowser(): Promise<FreezableBrowser> {
  const executable = chromeExecutable();
  const profile = mkdtempSync(join(tmpdir(), 'sandbox-e2e-chrome-'));
  let stderr = '';
  let proc: ReturnType<typeof spawnGroup> | null = null;
  const shutdown = async () => {
    await proc?.terminate();
    // A helper can still be flushing its cache for a moment after the main process exits.
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  };
  try {
    proc = spawnGroup(
      executable,
      [...CHROME_SWITCHES, `--user-data-dir=${profile}`, 'about:blank'],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
      }
    );
    proc.child.stderr?.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-4_000);
    });
    const running = proc;
    const portFile = join(profile, 'DevToolsActivePort');
    await waitFor(
      async () => {
        if (running.gone())
          throw new Error(`Chrome exited early: ${running.spawnError()?.message ?? stderr}`);
        return existsSync(portFile) && /^\d+\n/.test(readFileSync(portFile, 'utf8'));
      },
      30_000,
      () => `Chrome DevTools port\n${stderr}`
    );
    const port = readFileSync(portFile, 'utf8').split('\n')[0];
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true });
    const context = browser.contexts()[0];
    if (!context) throw new Error('Chrome exposed no default context');
    return {
      context,
      async tabs(n) {
        const pages = [...context.pages()];
        while (pages.length < n) pages.push(await context.newPage());
        return pages.slice(0, n);
      },
      async close() {
        try {
          await browser.close();
        } finally {
          await shutdown();
        }
      },
    };
  } catch (error) {
    await shutdown();
    throw error;
  }
}

/** Evaluate in the page over CDP; a script exception is an error, never a value. */
async function evaluate(
  cdp: Awaited<ReturnType<BrowserContext['newCDPSession']>>,
  expression: string
): Promise<unknown> {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(`evaluate failed: ${exceptionDetails.text}`);
  return result.value;
}

/**
 * Freeze or resume a tab the way the browser itself does (Chromium's Page Lifecycle).
 *
 * Fails closed, deterministically: a listener for the event the transition must fire
 * (`freeze` / `resume`) is installed first, and the call throws unless it fired. A
 * reading over CDP still works on a frozen page (DevTools tasks are not freezable),
 * which is how the flag is read. Visibility is no proof — a background tab is hidden
 * without being frozen — and a timer probe would depend on a timing window.
 */
export async function setLifecycle(page: Page, state: 'frozen' | 'active'): Promise<void> {
  const event = state === 'frozen' ? 'freeze' : 'resume';
  const flag = `__harnessLifecycle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const cdp = await page.context().newCDPSession(page);
  try {
    await evaluate(
      cdp,
      `window[${JSON.stringify(flag)}] = false;
       document.addEventListener(${JSON.stringify(event)}, () => { window[${JSON.stringify(flag)}] = true; }, { once: true });
       true`
    );
    await cdp.send('Page.setWebLifecycleState', { state });
    // A failed read propagates as itself; only "the event never fired" is reported as no effect.
    const deadline = Date.now() + 5_000;
    while ((await evaluate(cdp, `window[${JSON.stringify(flag)}]`)) !== true) {
      if (Date.now() > deadline)
        throw new Error(
          `${state} had no effect: no '${event}' event fired — use the \`freezable\` fixture`
        );
      await delay(100);
    }
    await evaluate(cdp, `delete window[${JSON.stringify(flag)}]`);
  } finally {
    await cdp.detach();
  }
}

export const test = base.extend<
  {
    tabs: (n: number) => Promise<Page[]>;
    freezable: FreezableBrowser;
    serverLogOnFailure: void;
  },
  { server: SandboxServer }
>({
  server: [
    async ({}, use) => {
      // A swap that was never restored leaves `.next` holding the wrong build.
      if (existsSync(HELD))
        throw new Error(
          `${HELD} exists — a previous build swap was not restored. If .next holds a ` +
            'swapped-in build, move it back to its source directory first; then move ' +
            '.next.e2e-held back to .next.'
        );
      const server = new SandboxServer();
      await server.start();
      try {
        await use(server);
      } finally {
        const t0 = Date.now();
        try {
          await server.restoreBuild();
        } finally {
          // Always stopped, even when the restore failed.
          await server.stop();
          const took = Date.now() - t0;
          if (took > 20_000) console.warn(`[harness] server teardown took ${took} ms`);
        }
      }
    },
    // Explicit, and well above the bounded worst case (2 × (SIGTERM 10 s + SIGKILL 10 s
    // + port release 15 s)), so a slow teardown fails loudly instead of being cut off.
    { scope: 'worker', timeout: 120_000 },
  ],
  baseURL: async ({ server }, use) => use(server.origin),
  /** n tabs in the test's ONE browser context (the first is the test's own `page`). */
  tabs: async ({ context, page }, use) => {
    await use(async (n) => {
      const pages = [page];
      while (pages.length < n) pages.push(await context.newPage());
      return pages;
    });
  },
  /**
   * A separate browser whose tabs can be frozen; its pages take absolute URLs (no
   * baseURL), and Playwright's own trace/screenshot settings do not reach them — so a
   * failure attaches a screenshot of each tab itself.
   */
  freezable: async ({}, use, testInfo) => {
    const browser = await launchFreezableBrowser();
    try {
      await use(browser);
    } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        for (const [i, page] of browser.context.pages().entries()) {
          const body = await within(
            page.screenshot().catch(() => null),
            5_000
          );
          if (body) await testInfo.attach(`freezable-tab-${i}`, { body, contentType: 'image/png' });
        }
      }
      await browser.close();
    }
  },
  /** Every failing test carries the server's last output. */
  serverLogOnFailure: [
    async ({ server }, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus)
        await testInfo.attach('server-log', { body: server.log(), contentType: 'text/plain' });
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
