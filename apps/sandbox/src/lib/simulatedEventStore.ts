/**
 * The platform-side `SimulatedEventResolved` record store (D-s §3, CH-1
 * discipline): the CHOICE record — which option the user picked, under which
 * catalogue version. It moves no money and never joins the C-P0 ledger set;
 * the money legs are already ledger events. Same localStorage + node-safe
 * in-memory degradation pattern as `proposalStore`.
 */

import { SIMULATED_EVENT_CATALOGUE_VERSION } from '@/config/simulatedEventCatalogue';

import { Logger } from './monitoring/Logger';
const STORAGE_KEY = 'diboas.sandbox.simulatedEvents.v1';

export interface SimulatedEventResolution {
  eventInstanceId: string;
  eventType: string;
  /** The option key the user chose (or 'postponed' never appears — postponement is absence). */
  choice: string;
  /** The catalogue version this event resolved under (honest replay across catalogue changes). */
  catalogueVersion: number;
  resolvedAt: string;
}

let memoryFallback: SimulatedEventResolution[] = [];

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function read(): SimulatedEventResolution[] {
  if (!storageAvailable()) return [...memoryFallback];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SimulatedEventResolution[]) : [];
  } catch {
    return [];
  }
}

function write(records: SimulatedEventResolution[]): void {
  if (!storageAvailable()) {
    memoryFallback = records;
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    // P7: a failed persist must never blank the flow — but log it (Principle 12).
    Logger.error('simulated-event store persist failed — memory fallback', {}, error);
    memoryFallback = records;
  }
}

/** All resolutions, oldest first. */
export function getResolutions(): SimulatedEventResolution[] {
  return read();
}

/** Record a resolution (idempotent per eventInstanceId — first record wins). */
export function recordResolution(input: {
  eventInstanceId: string;
  eventType: string;
  choice: string;
  resolvedAt: string;
}): void {
  const records = read();
  if (records.some((r) => r.eventInstanceId === input.eventInstanceId)) return;
  records.push({ ...input, catalogueVersion: SIMULATED_EVENT_CATALOGUE_VERSION });
  write(records);
}

/** Clear all records (sandbox reset rides along). */
export function clearSimulatedEvents(): void {
  memoryFallback = [];
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // memory fallback already clear
  }
}
