/**
 * Browser-safe client for Veil Midnight API routes.
 */

import type { VeilContractSnapshot } from './veil-contract';

export type MidnightStatusResponse = {
  configured: boolean;
  contractAddress?: string;
  ledger?: VeilContractSnapshot;
  error?: string;
  hint?: string;
};

type MidnightActionResponse = {
  ok?: boolean;
  ledger?: VeilContractSnapshot;
  error?: string;
  code?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function postMidnight(path: string, body?: Record<string, string>): Promise<MidnightActionResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await readJson<MidnightActionResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || `Midnight request failed (${response.status})`);
  }
  return payload;
}

const defaultStatusTimeoutMs = 4_000;

export async function fetchMidnightStatus(options?: { timeoutMs?: number }): Promise<MidnightStatusResponse> {
  const timeoutMs = options?.timeoutMs ?? defaultStatusTimeoutMs;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/midnight/status', {
      cache: 'no-store',
      signal: controller.signal,
    });
    return readJson<MidnightStatusResponse>(response);
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    return {
      configured: false,
      error: timedOut
        ? 'Midnight status request timed out. Devnet may be offline.'
        : error instanceof Error
          ? error.message
          : 'Unable to reach Midnight status API.',
      hint: 'Start docker compose and devnet, or remove NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS for local-only mode.',
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function registerStudentCommitmentOnChain(commitment: string): Promise<VeilContractSnapshot> {
  const payload = await postMidnight('/api/midnight/register-commitment', { commitment });
  if (!payload.ledger) {
    throw new Error('Missing ledger snapshot after registerStudentCommitment');
  }
  return payload.ledger;
}

export async function logComplaintOnChain(complaintHash: string): Promise<VeilContractSnapshot> {
  const payload = await postMidnight('/api/midnight/log-complaint', { complaintHash });
  if (!payload.ledger) {
    throw new Error('Missing ledger snapshot after logComplaint');
  }
  return payload.ledger;
}

export async function requestRevealOnChain(): Promise<VeilContractSnapshot> {
  const payload = await postMidnight('/api/midnight/request-reveal');
  if (!payload.ledger) {
    throw new Error('Missing ledger snapshot after requestReveal');
  }
  return payload.ledger;
}

export async function approveCommitteeRevealOnChain(): Promise<VeilContractSnapshot> {
  const payload = await postMidnight('/api/midnight/approve-reveal');
  if (!payload.ledger) {
    throw new Error('Missing ledger snapshot after approveCommitteeReveal');
  }
  return payload.ledger;
}
