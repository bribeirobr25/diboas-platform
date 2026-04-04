/**
 * Database Schema Types
 *
 * TypeScript interfaces matching the SQL schema in migrations/.
 */

export interface WaitlistEntryRow {
  id: string;
  email: string;
  email_hash: string;
  name: string | null;
  position: number;
  original_position: number;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  locale: string;
  source: string;
  tags: string[];
  gdpr_accepted: boolean;
  tier: string;
  country: string | null;
  version: number;
  email_opted_out: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaitlistCounterRow {
  key: string;
  value: number;
}

export interface EmailDeliveryLogRow {
  id: string;
  recipient_email: string;
  recipient_hash: string;
  template: string;
  subject: string;
  locale: string;
  status: string;
  provider_id: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
}

export interface DeletionTokenRow {
  token_hash: string;
  email: string;
  email_hash: string | null;
  expires_at: string;
  created_at: string;
}
