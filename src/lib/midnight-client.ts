/**
 * midnight-client.ts
 *
 * High-level client for interacting with the Veil Midnight contract.
 * Builds a headless wallet using the full wallet SDK and connects to
 * the running Docker devnet (compose.yml).
 *
 * Server-side only (Node.js). Do NOT import in browser React components.
 */

import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { ttlOneHour } from '@midnight-ntwrk/midnight-js-utils';
import {
  LedgerParameters,
  ZswapSecretKeys,
  DustSecretKey,
} from '@midnight-ntwrk/ledger-v8';
import { HDWallet, generateRandomSeed, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  UnshieldedWallet,
  createKeystore,
  PublicKey,
  InMemoryTransactionHistoryStorage,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { WebSocket } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';
import { Buffer } from 'buffer';

import { Contract, ledger, type Ledger } from '../../contracts/index.js';
import { type NetworkConfig, LOCAL_CONFIG } from './config.js';

// Node.js needs this for GraphQL subscriptions
// @ts-expect-error global WebSocket
globalThis.WebSocket = WebSocket;

// ─── ZK config path ────────────────────────────────────────────────────────

let _currentDir: string;
try {
  _currentDir = path.dirname(fileURLToPath(import.meta.url));
} catch {
  _currentDir = process.cwd() + '/src/lib';
}
// Resolves to <project-root>/contracts/managed/veil
export const zkConfigPath = path.resolve(_currentDir, '..', '..', 'contracts', 'managed', 'veil');

// ─── Compiled contract singleton ────────────────────────────────────────────

export const CompiledVeilContract = CompiledContract.make(
  'veilContract',
  Contract,
).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

// ─── Types ──────────────────────────────────────────────────────────────────

export type VeilCircuits = 'registerStudentCommitment' | 'logComplaint' | 'requestReveal' | 'approveCommitteeReveal';
export type VeilProviders = MidnightProviders<any>;

// ─── Wallet builder ──────────────────────────────────────────────────────────

export async function buildHeadlessWallet(
  seedHex: string,
  config: NetworkConfig = LOCAL_CONFIG,
) {
  const seed = Buffer.from(seedHex.padEnd(64, '0').slice(0, 64), 'hex');
  const hd = HDWallet.fromSeed(seed);
  if (hd.type !== 'seedOk') throw new Error('Invalid seed');

  const derivation = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivation.type !== 'keysDerived') throw new Error('Key derivation failed');
  hd.hdWallet.clear();

  const keys = derivation.keys;
  const shieldedSecretKeys = ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

  const indexerConn = { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS };
  const relayURL = new URL(config.nodeWS);
  const proofURL = new URL(config.proofServer);

  const shieldedWallet = ShieldedWallet({
    networkId: getNetworkId(),
    indexerClientConnection: indexerConn,
    provingServerUrl: proofURL,
    relayURL,
  }).startWithSecretKeys(shieldedSecretKeys);

  const unshieldedWallet = UnshieldedWallet({
    networkId: getNetworkId(),
    indexerClientConnection: indexerConn,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));

  const dustWallet = DustWallet({
    networkId: getNetworkId(),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
    indexerClientConnection: indexerConn,
    provingServerUrl: proofURL,
    relayURL,
  }).startWithSecretKey(dustSecretKey, LedgerParameters.initialParameters().dust);

  const walletConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: indexerConn,
    provingServerUrl: proofURL,
    relayURL,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  };

  const facade = await WalletFacade.init({
    configuration: walletConfig as any,
    shielded: () => shieldedWallet,
    unshielded: () => unshieldedWallet,
    dust: () => dustWallet,
  });
  
  await facade.start(shieldedSecretKeys, dustSecretKey);

  // Wait until wallet is synced
  console.log('Syncing wallet...');
  const state = await Rx.firstValueFrom(
    facade.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s: any) => s.isSynced),
      Rx.timeout({ each: 120_000, with: () => Rx.throwError(() => new Error('Wallet sync timeout')) }),
    ),
  );
  console.log('Wallet synced.');

  // Build a WalletProvider + MidnightProvider combined object
  const walletAndMidnight = {
    getCoinPublicKey: () => (state as any).shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => (state as any).shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await facade.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys, dustSecretKey },
        { ttl: ttl ?? ttlOneHour() },
      );
      return facade.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => facade.submitTransaction(tx),
    stop: () => facade.stop(),
  };

  return walletAndMidnight;
}

// ─── Provider builder ────────────────────────────────────────────────────────

export function buildVeilProviders(
  wallet: any,
  config: NetworkConfig = LOCAL_CONFIG,
): VeilProviders {
  const zkConfigProvider = new NodeZkConfigProvider<VeilCircuits>(zkConfigPath);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `veil-${Date.now()}`,
      walletProvider: wallet,
      privateStoragePasswordProvider: () => 'veil#pwdQ2$pL8@nR5!vW3*xK9m',
      accountId: `veil-account-${Date.now()}`,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}

// ─── Veil contract client ────────────────────────────────────────────────────

export interface VeilContractClient {
  contractAddress: string;
  getLedger: () => Promise<Ledger>;
  registerStudentCommitment: (commitment: Uint8Array) => Promise<void>;
  logComplaint: (complaintHash: Uint8Array) => Promise<void>;
  requestReveal: () => Promise<void>;
  approveCommitteeReveal: () => Promise<void>;
}

export async function deployVeilContract(providers: VeilProviders): Promise<VeilContractClient> {
  const deployed = await (deployContract as any)(providers, {
    compiledContract: CompiledVeilContract,
    privateStateId: 'veilPrivateState',
    initialPrivateState: {},
    args: [],
  });
  const contractAddress: string = deployed.deployTxData.public.contractAddress;
  console.log('Deployed at:', contractAddress);
  return makeClient(providers, contractAddress);
}

export function joinVeilContract(providers: VeilProviders, contractAddress: string): VeilContractClient {
  return makeClient(providers, contractAddress);
}

function makeClient(providers: VeilProviders, contractAddress: string): VeilContractClient {
  return {
    contractAddress,
    async getLedger(): Promise<Ledger> {
      const state = await providers.publicDataProvider.queryContractState(contractAddress);
      if (!state) throw new Error('Contract state not found');
      return ledger(state.data);
    },
    async registerStudentCommitment(commitment: Uint8Array) {
      await (submitCallTx as any)(providers, {
        compiledContract: CompiledVeilContract,
        contractAddress,
        privateStateId: 'veilPrivateState',
        circuitId: 'registerStudentCommitment',
        args: [commitment],
      });
    },
    async logComplaint(complaintHash: Uint8Array) {
      await (submitCallTx as any)(providers, {
        compiledContract: CompiledVeilContract,
        contractAddress,
        privateStateId: 'veilPrivateState',
        circuitId: 'logComplaint',
        args: [complaintHash],
      });
    },
    async requestReveal() {
      await (submitCallTx as any)(providers, {
        compiledContract: CompiledVeilContract,
        contractAddress,
        privateStateId: 'veilPrivateState',
        circuitId: 'requestReveal',
        args: [],
      });
    },
    async approveCommitteeReveal() {
      await (submitCallTx as any)(providers, {
        compiledContract: CompiledVeilContract,
        contractAddress,
        privateStateId: 'veilPrivateState',
        circuitId: 'approveCommitteeReveal',
        args: [],
      });
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function setupVeil(seedHex: string, config: NetworkConfig = LOCAL_CONFIG) {
  setNetworkId(config.networkId);
  const wallet = await buildHeadlessWallet(seedHex, config);
  const providers = buildVeilProviders(wallet, config);
  return { wallet, providers };
}
