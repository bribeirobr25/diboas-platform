/**
 * Errors the server catches reach Sentry (5.888).
 *
 * A route that catches an error, logs it with `Logger.error` and answers 500 never reaches Next's
 * `onRequestError`, so before this the error lived only in Vercel's short-lived runtime log and no
 * alert fired (the fourteenth audit proved it with a failing purge). `instrumentation.ts` connects
 * this sink on the server and edge runtimes only, after their Sentry config has loaded; events go
 * through that config's `beforeSend`, which scrubs them (5.862).
 */
import * as Sentry from '@sentry/nextjs';
import { Logger, LogLevel, type LogEntry } from './Logger';

/**
 * Context fields that become Sentry tags: few distinct values each, so they can be searched and
 * grouped. A caller that logs an error and then captures the same Error itself (the market
 * fetchers) would lose its own tags, because Sentry drops the second capture of one Error; the
 * one event that does go through carries them from here.
 */
const TAG_KEYS = ['surface', 'endpoint', 'view'] as const;

function tagsOf(entry: LogEntry): Record<string, string> {
  const tags: Record<string, string> = { source: 'logger' };
  for (const key of TAG_KEYS) {
    const value = entry.context?.[key];
    if (typeof value === 'string' && value !== '') tags[key] = value;
  }
  const correlationId = entry.requestId ?? entry.context?.correlationId;
  if (typeof correlationId === 'string' && correlationId !== '') tags.correlationId = correlationId;
  return tags;
}

/** One Logger ERROR or CRITICAL entry as one Sentry event. */
export function sendLogEntryToSentry(entry: LogEntry): void {
  Sentry.captureException(entry.error ?? new Error(entry.message), {
    level: entry.level === LogLevel.CRITICAL ? 'fatal' : 'error',
    tags: tagsOf(entry),
    extra: { logMessage: entry.message, context: entry.context, callSite: entry.source },
  });
}

export function connectServerErrorSink(): void {
  Logger.setErrorSink(sendLogEntryToSentry);
}
