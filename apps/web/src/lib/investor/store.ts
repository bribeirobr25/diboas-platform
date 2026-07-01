/**
 * Investor request store — Neon persistence with PII encrypted at rest.
 *
 * Mirrors the waitlist privacy model: AES-256-GCM for PII columns, an
 * HMAC-SHA256 blind index on the email for duplicate detection without storing
 * plaintext. All encryption flows through `lib/security/encryption`.
 */

import { sql } from '@/lib/database/client';
import { encrypt, hmacHash } from '@/lib/security/encryption';
import type { InvestorRequestInput } from './types';

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** True if an investor request with this email already exists (blind-index lookup). */
export async function investorEmailExists(email: string): Promise<boolean> {
  const index = hmacHash(normalizeEmail(email));
  if (!index) return false;
  const rows = await sql`
    SELECT 1 FROM investor_requests WHERE email_blind_index = ${index} LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Insert an investor request. Returns false (without inserting) if encryption is
 * unavailable — we never persist unencrypted PII (fail-closed).
 */
export async function insertInvestorRequest(input: InvestorRequestInput): Promise<boolean> {
  const email = normalizeEmail(input.email);
  const emailEncrypted = encrypt(email);
  const emailBlindIndex = hmacHash(email);
  if (!emailEncrypted || !emailBlindIndex) return false;

  const nameEncrypted = input.name ? encrypt(input.name) : null;
  const companyEncrypted = input.company ? encrypt(input.company) : null;
  const thesisEncrypted = input.thesis ? encrypt(input.thesis) : null;
  const messageEncrypted = input.message ? encrypt(input.message) : null;

  await sql`
    INSERT INTO investor_requests (
      email_encrypted, email_blind_index, name_encrypted, company_encrypted,
      investor_type, ticket_size, thesis_encrypted, message_encrypted,
      locale, country, correlation_id
    ) VALUES (
      ${emailEncrypted}, ${emailBlindIndex}, ${nameEncrypted}, ${companyEncrypted},
      ${input.investorType ?? null}, ${input.ticketSize ?? null}, ${thesisEncrypted}, ${messageEncrypted},
      ${input.locale ?? null}, ${input.country ?? null}, ${input.correlationId ?? null}
    )
  `;
  return true;
}
