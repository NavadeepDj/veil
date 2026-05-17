/**
 * Server-only singleton for Veil Midnight wallet + contract client.
 */

import { getConfig } from './config';
import {
  joinVeilContract,
  setupVeil,
  type VeilContractClient,
} from './midnight-client';
import { ledgerToSnapshot, type VeilContractSnapshot } from './veil-contract';

const DEFAULT_WALLET_SEED =
  process.env.VEIL_WALLET_SEED ??
  '0000000000000000000000000000000000000000000000000000000000000001';

type VeilSession = {
  client: VeilContractClient;
};

declare global {
  // eslint-disable-next-line no-var
  var __veilSessionPromise: Promise<VeilSession> | undefined;
  // eslint-disable-next-line no-var
  var __veilTxQueue: Promise<unknown> | undefined;
}

export function getContractAddress(): string | null {
  const address = process.env.NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS?.trim();
  return address || null;
}

export function isMidnightConfigured(): boolean {
  return Boolean(getContractAddress());
}

async function createSession(): Promise<VeilSession> {
  const contractAddress = getContractAddress();
  if (!contractAddress) {
    throw new Error('NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS is not set');
  }

  const { providers } = await setupVeil(DEFAULT_WALLET_SEED, getConfig());
  return { client: joinVeilContract(providers, contractAddress) };
}

export async function getVeilClient(): Promise<VeilContractClient> {
  if (!globalThis.__veilSessionPromise) {
    globalThis.__veilSessionPromise = createSession();
  }

  try {
    return (await globalThis.__veilSessionPromise).client;
  } catch (error) {
    globalThis.__veilSessionPromise = undefined;
    throw error;
  }
}

/** Serialize on-chain writes so concurrent UI actions do not race the wallet. */
export function withMidnightLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = globalThis.__veilTxQueue ?? Promise.resolve();
  const next = previous.then(operation, operation);
  globalThis.__veilTxQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function readLedgerSnapshot(): Promise<VeilContractSnapshot> {
  const client = await getVeilClient();
  const ledger = await client.getLedger();
  return ledgerToSnapshot(ledger);
}

export function resetVeilSessionForTests() {
  globalThis.__veilSessionPromise = undefined;
  globalThis.__veilTxQueue = undefined;
}
