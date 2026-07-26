/**
 * Sandbox Logger — minimal structured, console-backed observability
 * (P1.2 slice-1b step 0; Principle 12). `apps/web` has `@/lib/monitoring/Logger`;
 * the sandbox had none, and P1.2 v2 §13 P12 makes store logging via a `Logger`
 * an explicit slice-1b requirement.
 *
 * Structured so failures are greppable, not silent. This is for app-runtime
 * code (`client.ts`, `PostgresLedgerStore`, `ledgerClient`); the migration CLI
 * (`migrate.mjs`) logs to `console` directly since it is a standalone script.
 *
 * The ledger EVENTS hold no PII. But `PostgresLedgerStore` passes `ownerKey` as
 * context, which under Option 2 is the account `users.id` — pseudonymous
 * personal data. Inert while this only writes to `console`; **the moment Phase 2
 * routes logs to an external sink (Sentry/PostHog/etc.), `ownerKey` handling is
 * a CLO question** (redact or hash it). Do not add real PII (name/email) here.
 */

type LogContext = Record<string, unknown>;
type LogLevel = 'error' | 'warn' | 'info';

function emit(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
  const entry: Record<string, unknown> = { level, message };
  if (context) Object.assign(entry, context);
  if (error !== undefined) {
    // Keep the stack — it's how a Phase-2 write-through persist failure is
    // diagnosed (CTO §16.8). `console` shows it; an external sink can strip it.
    entry.error =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
  }
  const tag = `[sandbox] ${message}`;
  if (level === 'error') console.error(tag, entry);
  else if (level === 'warn') console.warn(tag, entry);
  else console.info(tag, entry);
}

export const Logger = {
  error(message: string, context?: LogContext, error?: unknown): void {
    emit('error', message, context, error);
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, context);
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, context);
  },
};
