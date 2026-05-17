/**
 * veil-midnight.test.ts
 *
 * End-to-end integration test for the Veil Midnight contract using testkit-js.
 * testkit-js will automatically spin up ephemeral Docker containers for the node,
 * indexer, proof-server, and faucet, fund the test wallets, and tear everything down.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestEnvironment } from '@midnight-ntwrk/testkit-js';
import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import {
  buildVeilProviders,
  deployVeilContract,
  hexToBytes,
  bytesToHex,
} from '../src/lib/midnight-client';

describe('Veil Midnight Contract (testkit-js ephemeral network)', () => {
  let testEnvironment: any;
  let wallet: any;
  let veilClient: any;

  beforeAll(async () => {
    console.log('\n=== Starting Ephemeral Midnight Devnet ===');
    const logger = pino({ level: 'silent' });
    testEnvironment = getTestEnvironment(logger);
    
    // Start node, indexer, proof server, faucet via Docker
    const envConfig = await testEnvironment.start();
    setNetworkId(envConfig.networkId);
    console.log('Devnet started. Network ID:', envConfig.networkId);

    console.log('Generating funded test wallet...');
    // testkit handles faucet funding automatically
    wallet = await testEnvironment.getMidnightWalletProvider();

    const config = {
      networkId: envConfig.networkId,
      indexer: envConfig.indexer,
      indexerWS: envConfig.indexerWS,
      node: envConfig.node,
      nodeWS: envConfig.nodeWS,
      proofServer: envConfig.proofServer,
      faucet: envConfig.faucet,
    };

    const providers = buildVeilProviders(wallet, config);

    console.log('Deploying Veil contract...');
    veilClient = await deployVeilContract(providers);
    console.log('✓ Deployed at:', veilClient.contractAddress);
  }, 300_000);

  afterAll(async () => {
    if (testEnvironment) {
      console.log('Tearing down devnet...');
      await testEnvironment.shutdown();
    }
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
    expect(state.caseCounter).toBe(1n);
    expect(state.disclosureState).toBe(0n);
  }, 120_000);

  it('requestReveal sets disclosureState=1', async () => {
    console.log('Calling requestReveal...');
    await veilClient.requestReveal();
    const state = await veilClient.getLedger();
    expect(state.disclosureState).toBe(1n);
  }, 120_000);

  it('approveCommitteeReveal sets disclosureState=2', async () => {
    console.log('Calling approveCommitteeReveal...');
    await veilClient.approveCommitteeReveal();
    const state = await veilClient.getLedger();
    expect(state.disclosureState).toBe(2n);
  }, 120_000);
});
