/**
 * Liveness Probe
 *
 * Minimal check: the process is running and can handle HTTP.
 * Used by orchestrators (Kubernetes, etc.) to detect hangs.
 * No dependency checks — those belong in the readiness probe.
 *
 * GET /api/health/live
 */

import { NextResponse } from 'next/server';

export function GET(): NextResponse {
  return NextResponse.json({ status: 'alive' });
}
