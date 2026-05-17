import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightWalletProvider } from './wallet';
import { type NetworkConfig } from './config';

export type VeilCircuits = 'registerStudentCommitment' | 'logComplaint' | 'requestReveal' | 'approveCommitteeReveal';

export type VeilProviders = MidnightProviders<any>;

export function buildProviders(
  wallet: MidnightWalletProvider,
  zkConfigPath: string,
  config: NetworkConfig,
): VeilProviders {
  const zkConfigProvider = new NodeZkConfigProvider<VeilCircuits>(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `veil-local-${Date.now()}`,
      walletProvider: wallet,
      privateStoragePasswordProvider: () => 'veil#pwdQ2$pL8@nR5!vW3*',
      accountId: `test-account-${Date.now()}`,
    } as never),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proofServer,
      zkConfigProvider,
    ),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
