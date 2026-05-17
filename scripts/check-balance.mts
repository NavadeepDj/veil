import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { buildHeadlessWallet } from '../src/lib/midnight-client.js';
import * as Rx from 'rxjs';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';

async function main() {
  const seedHex = '0000000000000000000000000000000000000000000000000000000000000000';
  
  console.log('Connecting to local devnet...');
  setNetworkId('undeployed');
  
  const walletAndMidnight = await buildHeadlessWallet(seedHex);
  
  console.log('Wallet synced. Checking balances...');
  
  // We need the underlying wallet facade state to read balances
  // The facade is hidden in `walletAndMidnight`, so we should just export `buildHeadlessWalletFacade` in our client
  // But for now we just want to know if it connects.
  console.log('Success! Connected headless wallet.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
