import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { setupVeil, deployVeilContract } from '../src/lib/midnight-client.js';
import * as Rx from 'rxjs';
import fs from 'fs';

// Default ALICE seed
const seedHex = '0000000000000000000000000000000000000000000000000000000000000001';

async function fundWallet(walletAddress: string) {
  console.log(`\nFunding wallet ${walletAddress} via local faucet...`);
  try {
    const response = await fetch(`http://127.0.0.1:8081/api/v1/faucet/send-test-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
    if (!response.ok) {
      throw new Error(`Faucet HTTP error: ${response.status}`);
    }
    console.log('✓ Faucet requested successfully. Waiting for block confirmation...');
    await new Promise(resolve => setTimeout(resolve, 15000));
  } catch (err) {
    console.error('Failed to contact local faucet:', err);
    console.log('Make sure docker compose is running and the faucet is up!');
  }
}

async function main() {
  console.log('=== Deploying Veil Contract to Local Devnet ===');
  const { wallet, providers } = await setupVeil(seedHex);
  
  const unshieldedAddress = await wallet.getCoinPublicKey();
  console.log('Wallet setup complete. Unshielded address:', unshieldedAddress);

  // Attempt to fund the wallet
  await fundWallet(unshieldedAddress);

  console.log('Deploying contract...');
  const veilClient = await deployVeilContract(providers);
  
  console.log('✓ Contract deployed successfully!');
  console.log('Contract Address:', veilClient.contractAddress);
  
  // Save to .env.local
  const envContent = `NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS=${veilClient.contractAddress}\n`;
  fs.writeFileSync('.env.local', envContent, { flag: 'w' });
  console.log('✓ Wrote contract address to .env.local');
  
  process.exit(0);
}

main().catch(err => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
