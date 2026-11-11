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

/** One Logger ERROR or CRITICAL entry as one Sentry event. */
export function sendLogEntryToSentry(entry: LogEntry): void {
  Sentry.captureException(entry.error ?? new Error(entry.message), {
    level: entry.level === LogLevel.CRITICAL ? 'fatal' : 'error',
    tags: { correlationId: entry.requestId, source: 'logger' },
    extra: { logMessage: entry.message, context: entry.context, callSite: entry.source },
  });
}

export function connectServerErrorSink(): void {
  Logger.setErrorSink(sendLogEntryToSentry);
}
