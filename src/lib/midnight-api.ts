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

export async function fetchMidnightStatus(): Promise<MidnightStatusResponse> {
  const response = await fetch('/api/midnight/status', { cache: 'no-store' });
  return readJson<MidnightStatusResponse>(response);
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
