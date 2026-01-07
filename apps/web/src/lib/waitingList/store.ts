/**
 * Waitlist Store
 *
 * Persistent store for pre-launch waitlist data with file-based fallback.
 * In production, this will be replaced with Kit.com API or database.
 *
 * Features:
 * - File-based persistence (survives server restarts)
 * - In-memory cache for fast reads
 * - Full WaitlistEntry type per spec
 */

import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt } from '@/lib/security/encryption';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * WaitlistEntry type - Full spec-compliant model
 */
export interface WaitlistEntry {
  /** Unique identifier */
  id: string;
  /** User email (primary key) */
  email: string;
  /** Optional display name */
  name?: string;
  /** Kit.com subscriber ID (when synced) */
  kitSubscriberId?: string;
  /** Current position in waitlist */
  position: number;
  /** Original position when first joined (immutable) */
  originalPosition: number;
  /** Unique referral code for this user */
  referralCode: string;
  /** Referral code that brought this user (if any) */
  referredBy?: string;
  /** Number of successful referrals */
  referralCount: number;
  /** User's locale */
  locale: string;
  /** Signup source tracking */
  source: WaitlistSource;
  /** Tags for segmentation */
  tags: string[];
  /** Timestamp of signup */
  createdAt: Date;
  /** Timestamp of last update */
  updatedAt: Date;
}

/**
 * Waitlist signup source types
 */
export type WaitlistSource =
  | 'landing_b2c'
  | 'landing_b2b'
  | 'interactive_demo'
  | 'dream_mode'
  | 'calculator'
  | 'referral'
  | 'direct';

// Storage configuration
const STORAGE_FILE = process.env.WAITLIST_STORAGE_PATH || '.waitlist-data.json';
const STORAGE_PATH = path.resolve(process.cwd(), STORAGE_FILE);

// In-memory cache
const store = new Map<string, WaitlistEntry>();

// Position counter (starts at a reasonable number to look established)
let positionCounter = 847;

// Entry ID counter
let entryIdCounter = 0;

// Initialize flag
let isInitialized = false;

/**
 * Serializable store data for persistence
 */
interface StoreData {
  entries: Array<WaitlistEntry & { createdAt: string; updatedAt: string }>;
  positionCounter: number;
  entryIdCounter: number;
}

/**
 * Initialize store from file (if exists)
 */
function initializeStore(): void {
  if (isInitialized) return;

  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, 'utf-8');
      const parsed: StoreData = JSON.parse(data);

      // Restore entries (decrypt PII if encrypted)
      for (const entry of parsed.entries) {
        const decryptedEntry: WaitlistEntry = {
          ...entry,
          email: decrypt(entry.email) || entry.email,
          name: entry.name ? (decrypt(entry.name) || entry.name) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        };
        // Use decrypted email as key for lookups
        store.set(decryptedEntry.email, decryptedEntry);
      }

      // Restore counters
      positionCounter = parsed.positionCounter || 847;
      entryIdCounter = parsed.entryIdCounter || 0;

      Logger.info('[Waitlist] Loaded entries from persistent storage', { count: store.size });
    }
  } catch (error) {
    Logger.warn('[Waitlist] Could not load persistent storage, starting fresh', { error: String(error) });
  }

  isInitialized = true;
}

/**
 * Persist store to file (encrypts PII fields)
 */
function persistStore(): void {
  try {
    const data: StoreData = {
      entries: Array.from(store.values()).map((entry) => ({
        ...entry,
        // Encrypt PII for storage
        email: encrypt(entry.email) || entry.email,
        name: entry.name ? (encrypt(entry.name) || entry.name) : undefined,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })) as StoreData['entries'],
      positionCounter,
      entryIdCounter,
    };

    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    Logger.error('[Waitlist] Failed to persist store', {}, error instanceof Error ? error : undefined);
  }
}

/**
 * Generate unique entry ID
 */
function generateEntryId(): string {
  entryIdCounter++;
  return `wl_${Date.now()}_${entryIdCounter}`;
}

// Initialize on first import
initializeStore();

/**
 * Get all entries (for debugging/admin)
 */
export function getAllEntries(): WaitlistEntry[] {
  initializeStore();
  return Array.from(store.values());
}

/**
 * Get entry by email
 */
export function getByEmail(email: string): WaitlistEntry | undefined {
  initializeStore();
  return store.get(email.toLowerCase().trim());
}

/**
 * Get entry by ID
 */
export function getById(id: string): WaitlistEntry | undefined {
  initializeStore();
  for (const entry of store.values()) {
    if (entry.id === id) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Get entry by referral code
 */
export function getByReferralCode(referralCode: string): WaitlistEntry | undefined {
  initializeStore();
  const code = referralCode.toUpperCase();
  for (const entry of store.values()) {
    if (entry.referralCode === code) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Check if email exists
 */
export function exists(email: string): boolean {
  initializeStore();
  return store.has(email.toLowerCase().trim());
}

/**
 * Input for adding new entry
 */
export interface AddEntryInput {
  email: string;
  name?: string;
  referralCode: string;
  referredBy?: string;
  locale: string;
  source?: WaitlistSource;
  tags?: string[];
}

/**
 * Add new entry
 */
export function addEntry(input: AddEntryInput): WaitlistEntry {
  initializeStore();

  const email = input.email.toLowerCase().trim();

  // Check for existing
  if (store.has(email)) {
    throw new Error('Email already exists');
  }

  const now = new Date();
  const position = ++positionCounter;

  const newEntry: WaitlistEntry = {
    id: generateEntryId(),
    email,
    name: input.name,
    kitSubscriberId: undefined,
    position,
    originalPosition: position, // Store original position
    referralCode: input.referralCode,
    referredBy: input.referredBy,
    referralCount: 0,
    locale: input.locale,
    source: input.source || 'direct',
    tags: input.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  store.set(email, newEntry);
  persistStore();

  return newEntry;
}

/**
 * Update entry
 */
export function updateEntry(email: string, updates: Partial<Omit<WaitlistEntry, 'id' | 'email' | 'originalPosition' | 'createdAt'>>): WaitlistEntry | undefined {
  initializeStore();

  const key = email.toLowerCase().trim();
  const existing = store.get(key);

  if (!existing) {
    return undefined;
  }

  const updated: WaitlistEntry = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
  store.set(key, updated);
  persistStore();

  return updated;
}

/**
 * Increment referral count and update position
 */
export function processReferral(referrerEmail: string, spotsPerReferral: number): WaitlistEntry | undefined {
  initializeStore();

  const key = referrerEmail.toLowerCase().trim();
  const referrer = store.get(key);

  if (!referrer) {
    return undefined;
  }

  const updatedReferrer: WaitlistEntry = {
    ...referrer,
    referralCount: referrer.referralCount + 1,
    position: Math.max(1, referrer.position - spotsPerReferral),
    updatedAt: new Date(),
  };
  store.set(key, updatedReferrer);
  persistStore();

  return updatedReferrer;
}

/**
 * Get current position counter (for admin/stats)
 */
export function getCurrentPositionCounter(): number {
  initializeStore();
  return positionCounter;
}

/**
 * Get total waitlist count
 */
export function getTotalCount(): number {
  initializeStore();
  return store.size;
}

/**
 * Update Kit.com subscriber ID
 */
export function updateKitSubscriberId(email: string, kitSubscriberId: string): WaitlistEntry | undefined {
  return updateEntry(email, { kitSubscriberId });
}

/**
 * Add tags to entry
 */
export function addTags(email: string, newTags: string[]): WaitlistEntry | undefined {
  initializeStore();

  const key = email.toLowerCase().trim();
  const existing = store.get(key);

  if (!existing) {
    return undefined;
  }

  const uniqueTags = Array.from(new Set([...existing.tags, ...newTags]));
  return updateEntry(email, { tags: uniqueTags });
}

/**
 * Clear store (for testing)
 */
export function clearStore(): void {
  store.clear();
  positionCounter = 847;
  entryIdCounter = 0;
  isInitialized = true;
  persistStore();
}

/**
 * Force reload from file (for testing/admin)
 */
export function reloadFromFile(): void {
  store.clear();
  isInitialized = false;
  initializeStore();
}

/**
 * Delete entry by email (GDPR right to deletion)
 *
 * @param email - Email of entry to delete
 * @returns true if deleted, false if not found
 */
export function deleteByEmail(email: string): boolean {
  initializeStore();

  const key = email.toLowerCase().trim();

  if (!store.has(key)) {
    return false;
  }

  store.delete(key);
  persistStore();
  Logger.info('[Waitlist] Entry deleted for GDPR request');
  return true;
}
