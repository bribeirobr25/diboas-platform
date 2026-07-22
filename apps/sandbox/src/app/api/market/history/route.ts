/**
 * GET /api/market/history?days=N
 *
 * Per-protocol daily APY history for ALL six execution protocols (the time
 * machine's replay source). Provider-cached server-side (6h chart TTL).
 */

import { NextRequest, NextResponse } from 'next/server';
import { DefiLlamaApyProvider, type ProtocolId } from '@diboas/defi';

const PROTOCOLS: ProtocolId[] = [
  'skySsr',
  'aaveV3',
  'compoundV3',
  'sanctumInf',
  'jupiterJlp',
  'jito',
];

const apyProvider = new DefiLlamaApyProvider();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const daysRaw = Number(request.nextUrl.searchParams.get('days') ?? '365');
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.trunc(daysRaw), 1), 730) : 365;
  try {
    const histories = await Promise.all(
      PROTOCOLS.map((protocolId) => apyProvider.getApyHistory(protocolId, days))
    );
    return NextResponse.json({ days, histories }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'history_unavailable' }, { status: 503 });
  }
}
