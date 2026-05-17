import { NextResponse } from 'next/server';

import { getContractAddress, isMidnightConfigured, readLedgerSnapshot, withMidnightLock } from './veil-session';

export function contractNotConfiguredResponse() {
  return NextResponse.json(
    {
      error: 'Veil contract address is not configured.',
      code: 'CONTRACT_NOT_CONFIGURED',
      hint: 'Start docker compose, then run GET /api/deploy or npm run deploy:local',
    },
    { status: 503 },
  );
}

export function midnightErrorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : 'Midnight operation failed';
  return NextResponse.json({ error: message, code: 'MIDNIGHT_ERROR' }, { status });
}

export async function ensureConfigured() {
  if (!isMidnightConfigured()) {
    return contractNotConfiguredResponse();
  }
  return null;
}

export async function runMidnightAction(operation: () => Promise<void>) {
  const notReady = await ensureConfigured();
  if (notReady) {
    return notReady;
  }

  try {
    await withMidnightLock(operation);
    const ledger = await readLedgerSnapshot();
    return NextResponse.json({ ok: true, ledger });
  } catch (error) {
    return midnightErrorResponse(error);
  }
}

export function parseHex32(field: string, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return { error: `${field} is required` };
  }

  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    return { error: `${field} must be a 32-byte hex string` };
  }

  return { bytes: Uint8Array.from(clean.match(/.{2}/g) ?? [], (pair) => parseInt(pair, 16)) };
}

export function statusPayload() {
  const contractAddress = getContractAddress() ?? undefined;
  return {
    configured: isMidnightConfigured(),
    contractAddress,
    hint: isMidnightConfigured()
      ? undefined
      : 'Set NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS via /api/deploy or deploy:local',
  };
}
