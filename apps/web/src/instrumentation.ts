/**
 * Instrumentation for Next.js
 *
 * This file is used to instrument the Node.js and Edge runtimes.
 * Sentry uses this to automatically capture server-side errors.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
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
      | 'react-server-components'
      | 'react-server-components-payload'
      | 'server-rendering';
    revalidateReason: 'on-demand' | 'stale' | undefined;
    renderType: 'dynamic' | 'dynamic-resume';
  }
): Promise<void> {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(error, {
    // E-2: tag with the request id (middleware-set x-request-id) so this server
    // door correlates with the client door (ErrorReportingService.captureException).
    // beforeSend scrubs user/extra/breadcrumbs but NOT tags, so the id survives.
    tags: { correlationId: request.headers['x-request-id'] },
    extra: {
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
}
