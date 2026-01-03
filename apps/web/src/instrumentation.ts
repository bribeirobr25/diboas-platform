/**
 * Instrumentation for Next.js
 *
 * This file is used to instrument the Node.js runtime.
 * Sentry uses this to automatically capture server-side errors.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
