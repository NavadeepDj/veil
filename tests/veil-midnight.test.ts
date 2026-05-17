/**
 * veil-midnight.test.ts
 *
 * End-to-end integration test for the Veil Midnight contract.
 *
 * Prerequisites:
 *   docker compose up -d --wait
 *
 * Run with:
 *   npm run test:midnight
 *
 * Takes ~3-5 minutes (wallet sync + ZK proof generation per circuit call).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { getConfig } from '../src/lib/config';
import {
  buildHeadlessWallet,
  buildVeilProviders,
  deployVeilContract,
  hexToBytes,
  bytesToHex,
} from '../src/lib/midnight-client';

const ALICE_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

describe('Veil Midnight Contract (local devnet)', () => {
  let wallet: any;
  let veilClient: any;

  const config = getConfig();

  beforeAll(async () => {
    console.log('\n=== Setting up Veil integration test ===');
    setNetworkId(config.networkId);

    console.log('Building wallet from seed...');
    wallet = await buildHeadlessWallet(ALICE_SEED, config);

    const providers = buildVeilProviders(wallet, config);

    console.log('Deploying Veil contract to local devnet...');
    veilClient = await deployVeilContract(providers);
    console.log('✓ Deployed at:', veilClient.contractAddress);
  }, 300_000);

  afterAll(async () => {
    if (wallet?.stop) await wallet.stop();
  });

  it('initial state: proofVerified=false, caseCounter=0', async () => {
    const state = await veilClient.getLedger();
    console.log('Initial ledger state:', state);
    expect(state.proofVerified).toBe(false);
    expect(state.caseCounter).toBe(0n);
    expect(state.disclosureState).toBe(0n);
  }, 30_000);

  it('registerStudentCommitment sets proofVerified=true', async () => {
    const commitment = hexToBytes(
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    );
    console.log('Calling registerStudentCommitment...');
    await veilClient.registerStudentCommitment(commitment);

    const state = await veilClient.getLedger();
    console.log('After register:', state);
    expect(state.proofVerified).toBe(true);
    expect(bytesToHex(state.studentCommitment)).toBe(
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    );
  }, 120_000);

  it('logComplaint increments caseCounter to 1', async () => {
    const complaintHash = hexToBytes(
      'deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000',
    );
    console.log('Calling logComplaint...');
    await veilClient.logComplaint(complaintHash);

    const state = await veilClient.getLedger();
    console.log('After logComplaint:', state);
    expect(state.caseCounter).toBe(1n);
    expect(state.disclosureState).toBe(0n);
  }, 120_000);

  it('requestReveal sets disclosureState=1', async () => {
    console.log('Calling requestReveal...');
    await veilClient.requestReveal();
    const state = await veilClient.getLedger();
    console.log('After requestReveal:', state);
    expect(state.disclosureState).toBe(1n);
  }, 120_000);

  it('approveCommitteeReveal sets disclosureState=2', async () => {
    console.log('Calling approveCommitteeReveal...');
    await veilClient.approveCommitteeReveal();
    const state = await veilClient.getLedger();
    console.log('After approveCommitteeReveal:', state);
    expect(state.disclosureState).toBe(2n);
  }, 120_000);
});
