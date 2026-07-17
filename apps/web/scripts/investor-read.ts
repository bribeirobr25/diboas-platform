/**
 * Investor-request reader — decrypts stored /investors submissions for follow-up.
 *
 * The DB stores PII encrypted (AES-256-GCM) with an HMAC blind index; this is
 * the founder-side runbook tool the notification email points at ("open the
 * encrypted record"). Prints to the terminal only — never writes plaintext
 * anywhere.
 *
 * Usage (from apps/web, needs DATABASE_URL + ENCRYPTION_KEY of the LIVE db):
 *   pnpm investor:read              # latest 10 requests, decrypted
 *   pnpm investor:read -- --id 3    # one request by id
 *
 * Env comes from .env.local via tsx --env-file (see package.json). If decryption
 * fails on every field, the local ENCRYPTION_KEY does not match the one the
 * deployed app encrypted with — copy both values from Vercel → Settings →
 * Environment Variables (see INFRASTRUCTURE_GUIDE, item 5.72).
 */

import { neon } from '@neondatabase/serverless';
import { decrypt, isEncryptionEnabled } from '../src/lib/security/encryption';

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function show(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const plain = decrypt(String(value));
  return plain === null ? '[decrypt FAILED — ENCRYPTION_KEY mismatch?]' : plain;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) fail('DATABASE_URL is not set (run via pnpm investor:read).');
  if (!isEncryptionEnabled()) fail('ENCRYPTION_KEY is not set — refusing to guess.');

  const host = new URL(process.env.DATABASE_URL).host;
  console.log(`Reading investor_requests on ${host}\n`);

  const idFlag = process.argv.indexOf('--id');
  const id = idFlag > -1 ? Number(process.argv[idFlag + 1]) : null;
  if (idFlag > -1 && (!Number.isInteger(id) || id! < 1)) fail('--id expects a positive integer.');

  const sql = neon(process.env.DATABASE_URL);
  const rows = id
    ? await sql`SELECT * FROM investor_requests WHERE id = ${id}`
    : await sql`SELECT * FROM investor_requests ORDER BY created_at DESC LIMIT 10`;

  if (rows.length === 0) {
    console.log(id ? `No request with id ${id}.` : 'No investor requests stored.');
    return;
  }

  for (const row of rows) {
    console.log(`── Request #${row.id} · ${row.created_at} ─────────────────`);
    console.log(`  Email:       ${show(row.email_encrypted)}`);
    console.log(`  Name:        ${show(row.name_encrypted)}`);
    console.log(`  Company:     ${show(row.company_encrypted)}`);
    console.log(`  Type:        ${row.investor_type ?? '—'}`);
    console.log(`  Ticket size: ${row.ticket_size ?? '—'}`);
    console.log(`  Thesis:      ${show(row.thesis_encrypted)}`);
    console.log(`  Message:     ${show(row.message_encrypted)}`);
    console.log(`  Locale:      ${row.locale ?? '—'} · Correlation: ${row.correlation_id ?? '—'}`);
    console.log('');
  }
  console.log(
    `${rows.length} request(s). Reply-To on the notification email also carries the address.`
  );
}

void main();
