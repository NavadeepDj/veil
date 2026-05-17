import { NextResponse } from 'next/server';

import { emptyVeilContractSnapshot } from '@/lib/veil-contract';
import { statusPayload } from '@/lib/midnight-route-utils';
import { readLedgerSnapshot } from '@/lib/veil-session';

export const runtime = 'nodejs';

export async function GET() {
  const base = statusPayload();

  if (!base.configured) {
    return NextResponse.json({
      ...base,
      ledger: emptyVeilContractSnapshot,
    });
  }

  try {
    const ledger = await Promise.race([
      readLedgerSnapshot(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Midnight ledger read timed out')), 3_000);
      }),
    ]);
    return NextResponse.json({ ...base, ledger });
  } catch (error) {
    return NextResponse.json({
      ...base,
      ledger: emptyVeilContractSnapshot,
      error: error instanceof Error ? error.message : 'Unable to read contract ledger',
    });
  }
}
