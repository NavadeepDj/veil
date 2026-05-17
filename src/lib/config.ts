export type NetworkConfig = {
  networkId: string;
  indexer: string;
  indexerWS: string;
  node: string;
  nodeWS: string;
  proofServer: string;
  /** Optional local faucet (not in default compose.yml). Genesis seed wallet often has funds without it. */
  faucet: string;
};

export const LOCAL_CONFIG: NetworkConfig = {
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node: 'http://127.0.0.1:9944',
  nodeWS: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
  faucet: '',
};

export function getConfig(): NetworkConfig {
  const network = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK ?? 'local';
  if (network !== 'local') {
    throw new Error(
      `Unknown network: ${network}. This harness currently only supports 'local'.`,
    );
  }
  return LOCAL_CONFIG;
}
