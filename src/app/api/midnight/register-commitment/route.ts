import { NextResponse } from 'next/server';

import { ensureConfigured, midnightErrorResponse, parseHex32, runMidnightAction } from '@/lib/midnight-route-utils';
import { getVeilClient } from '@/lib/veil-session';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  const notReady = await ensureConfigured();
  if (notReady) {
    return notReady;
  }

  try {
    const body = (await request.json()) as { commitment?: unknown };
    const parsed = parseHex32('commitment', body.commitment);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const client = await getVeilClient();
    return runMidnightAction(() => client.registerStudentCommitment(parsed.bytes));
  } catch (error) {
    return midnightErrorResponse(error);
  }
}
