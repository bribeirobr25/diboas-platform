/**
 * Instrumentation for Next.js
 *
 * This file is used to instrument the Node.js and Edge runtimes.
 * Sentry uses this to automatically capture server-side errors.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { scrubUrl } from '@/lib/utils/scrubUrl';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    await alertOnMalformedKeys();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

/**
 * Captures server-side request errors (RSC, route handlers, middleware).
 * Called automatically by Next.js when a request-time error occurs.
 */
export async function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource:
      'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason: 'on-demand' | 'stale' | undefined;
    renderType: 'dynamic' | 'dynamic-resume';
  }
): Promise<void> {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(error, {
    // E-2: tag with the request id (middleware-set x-request-id) so this server
    // door correlates with the client door (ErrorReportingService.captureException).
    // beforeSend (sentry.server.config.ts → scrubSentryEvent, 5.862) scrubs the user, request,
    // extra and breadcrumbs but NOT tags, so the id survives.
    tags: { correlationId: request.headers['x-request-id'] },
    extra: {
      path: scrubUrl(request.path), // a query string may carry a token (5.862)
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
}

/**
 * 5.865 (founder ruling 2026-11-10): a wrong-length encryption key raises a FATAL Sentry event
 * once per server start; the site stays up and every personal-data route refuses as before.
 * If env.ts cannot even load (a MISSING secret throws there), this does nothing: requests then
 * fail and report exactly as they do today, and startup is not turned into a crash.
 */
export async function alertOnMalformedKeys(): Promise<void> {
  let problems: string[];
  try {
    problems = (await import('@/config/env')).malformedKeyProblems();
  } catch {
    return;
  }
  if (problems.length === 0) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureMessage(`Malformed production secret: ${problems.join('; ')}`, 'fatal');
}
