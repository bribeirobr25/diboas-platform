/**
 * request.mjs — one authenticated provider request, with its evidence (E1, 2026-10-20).
 *
 * SAFEGUARDS (Codex audit of pilot round 1; owner-confirmed):
 *   * ORIGIN: the URL's origin must equal the provider's configured origin, or
 *     nothing is sent. The API key header never reaches another host.
 *   * REDIRECTS ARE REFUSED (`redirect: 'error'`). Node's fetch strips only
 *     `Authorization` on a cross-origin redirect and FORWARDS custom key
 *     headers (`X-API-Key`, `x-soso-api-key`), so following one would hand the
 *     key to the new host.
 *   * BOUNDED RETRIES: at most two attempts; a second only after a network
 *     error, a body that failed to arrive, or HTTP 5xx; 401/403/429 stop that
 *     provider for the run, even when their body fails too.
 *   * A RESPONSE IS COMPLETE ONLY WITH ITS BODY: a failure while reading it is a
 *     failed attempt (status kept, no body, no hash), never a success.
 *   * EVIDENCE STORAGE FAILURES are their own error (`EvidenceStorageError`):
 *     never retried as a request, never returned as a success.
 *   * EVERY ATTEMPT IS ITS OWN EVIDENCE: each response body is written to its
 *     own file, opened exclusively (`wx`), and described by its own manifest
 *     row (status, sha256, bytes, time). A retry can never overwrite the body
 *     an earlier row refers to.
 *   * SECRETS stay out of evidence, errors and returned messages: every known
 *     key is replaced by `[REDACTED]` before anything is written or returned.
 *
 * Nothing here decides whether data is usable; that is ledger.mjs / window.mjs.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { appendJsonlLine } from '../lib/jsonl.mjs';

export const REQUEST_POLICY = Object.freeze({
  maxAttempts: 2,
  retryDelayMs: 5_000,
  timeoutMs: 20_000,
  stopStatuses: Object.freeze([401, 403, 429]),
});

export class ProviderStopped extends Error {
  constructor(provider, status) {
    super(`${provider} answered ${status}; stopping this provider for the run`);
    this.provider = provider;
    this.status = status;
  }
}

/**
 * Writing the evidence failed (disk, permissions): a STORAGE failure, not a
 * transport one. It is never retried as a request and a request whose
 * evidence could not be written never counts as a success (2026-10-21).
 */
export class EvidenceStorageError extends Error {
  constructor(provider, message) {
    super(`${provider}: evidence could not be written (${message})`);
    this.provider = provider;
  }
}

/** Replace every known secret (8+ characters) with [REDACTED]. */
export function redact(text, secrets) {
  let out = String(text);
  for (const s of secrets)
    if (typeof s === 'string' && s.length >= 8) out = out.split(s).join('[REDACTED]');
  return out;
}

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

/**
 * Evidence for a run: one body file per attempt plus an append-only manifest.
 *
 * @param {string} dir — created if absent
 * @param {string[]} secrets — values to redact before writing
 */
export function createEvidenceStore(dir, secrets = []) {
  const bodies = path.join(dir, 'bodies');
  fs.mkdirSync(bodies, { recursive: true });
  const manifest = path.join(dir, 'manifest.jsonl');
  return {
    manifest,
    /**
     * Record one attempt; returns the manifest row.
     *
     * @param {{provider: string, url: string, attempt: number, retrievedAt: string,
     *   status?: number | null, body?: string | null, error?: string | null}} attempt
     */
    record({ provider, url, attempt, retrievedAt, status = null, body = null, error = null }) {
      const attemptId = `${retrievedAt.replace(/[:.]/g, '-')}-${provider}-${crypto.randomUUID()}`;
      /** @type {{attempt_id: string, provider: string, url: string, attempt: number,
       *   retrieved_at: string, status: number | null, error: string | null,
       *   sha256: string | null, bytes: number | null, saved_as: string | null}} */
      const row = {
        attempt_id: attemptId,
        provider,
        url: redact(url, secrets),
        attempt,
        retrieved_at: retrievedAt,
        status,
        error: error === null ? null : redact(error, secrets),
        sha256: null,
        bytes: null,
        saved_as: null,
      };
      if (body !== null) {
        const clean = redact(body, secrets);
        const file = path.join(bodies, `${attemptId}.json`);
        fs.writeFileSync(file, clean, { flag: 'wx' }); // never overwrite earlier evidence
        Object.assign(row, {
          sha256: sha256(clean),
          bytes: Buffer.byteLength(clean),
          saved_as: path.relative(dir, file),
        });
      }
      appendJsonlLine(manifest, JSON.stringify(row));
      return row;
    },
  };
}

/**
 * GET one provider URL and parse its JSON body.
 *
 * @param {object} o
 * @param {string} o.provider — provider id, for evidence and errors
 * @param {string} o.url — the full request URL
 * @param {string} o.allowedOrigin — e.g. 'https://api.cryptoetf.today'
 * @param {Record<string,string>} o.headers — including the key header
 * @param {ReturnType<typeof createEvidenceStore>} o.evidence
 * @param {string[]} [o.secrets]
 * @param {typeof fetch} [o.fetchImpl]
 * @param {(ms: number) => Promise<void>} [o.sleep]
 * @param {() => Date} [o.now]
 * @returns {Promise<{json: unknown, evidence: object}>}
 */
export async function fetchProviderJson({
  provider,
  url,
  allowedOrigin,
  headers,
  evidence,
  secrets = [],
  fetchImpl = fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  now = () => new Date(),
  policy = REQUEST_POLICY,
}) {
  if (new URL(url).origin !== allowedOrigin) {
    throw new Error(
      `${provider}: refused to send a request to another origin than ${allowedOrigin}`
    );
  }
  // The cause is kept: Node reports a refused redirect, a reset and a DNS
  // failure all as "TypeError: fetch failed", and only the cause tells them apart.
  const describe = (err) => {
    const cause = err?.cause?.message ? ` (${err.cause.message})` : '';
    return redact(`${err?.name ?? 'Error'}: ${err?.message ?? err}${cause}`, secrets);
  };
  const record = (entry) => {
    try {
      return evidence.record(entry);
    } catch (err) {
      throw new EvidenceStorageError(provider, describe(err));
    }
  };
  let lastError = null;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    const retrievedAt = now().toISOString();
    const retry = async (error) => {
      lastError = error;
      if (attempt < policy.maxAttempts) await sleep(policy.retryDelayMs);
    };
    let res;
    try {
      res = await fetchImpl(url, {
        headers,
        redirect: 'error',
        signal: AbortSignal.timeout(policy.timeoutMs),
      });
    } catch (err) {
      const message = describe(err);
      record({ provider, url, attempt, retrievedAt, error: message });
      // A refused redirect is a security event, not an outage: asking again
      // would only be refused again. It ends the request at once.
      if (/redirect/i.test(String(err?.cause?.message ?? ''))) {
        throw new Error(`${provider}: request failed, redirect refused (${message})`);
      }
      await retry(new Error(`${provider}: request failed (${message})`));
      continue;
    }
    // Headers arrived; the response is complete only once its body is read. A
    // body that fails (reset, abort, timeout) keeps the status it came with,
    // and no body or hash is recorded for it (2026-10-21, Codex audit).
    let body;
    try {
      body = await res.text();
    } catch (err) {
      const message = describe(err);
      record({
        provider,
        url,
        attempt,
        retrievedAt,
        status: res.status,
        error: `body read failed: ${message}`,
      });
      if (policy.stopStatuses.includes(res.status)) throw new ProviderStopped(provider, res.status);
      const failure = new Error(`${provider}: HTTP ${res.status}, body read failed (${message})`);
      if (res.status !== 200 && res.status < 500) throw failure;
      await retry(failure);
      continue;
    }
    const row = record({ provider, url, attempt, retrievedAt, status: res.status, body });
    if (policy.stopStatuses.includes(res.status)) throw new ProviderStopped(provider, res.status);
    if (res.status >= 500) {
      await retry(new Error(`${provider}: HTTP ${res.status}`));
      continue;
    }
    if (res.status !== 200) throw new Error(`${provider}: HTTP ${res.status}`);
    try {
      return { json: JSON.parse(body), evidence: row };
    } catch {
      throw new Error(`${provider}: response is not JSON (evidence ${row.attempt_id})`);
    }
  }
  throw lastError;
}
