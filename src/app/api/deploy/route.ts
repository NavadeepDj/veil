import { NextResponse } from 'next/server';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { setupVeil, deployVeilContract } from '@/lib/midnight-client';
import { LOCAL_CONFIG } from '@/lib/config';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300;

const seedHex = '0000000000000000000000000000000000000000000000000000000000000001';

export async function GET() {
  try {
    setNetworkId(LOCAL_CONFIG.networkId);
    const { wallet, providers } = await setupVeil(seedHex, LOCAL_CONFIG);
    const unshieldedAddress = await (wallet as any).getCoinPublicKey();

  // Optional faucet — default compose.yml has no service on :8081. The dev wallet seed
  // (0000…0001) is the genesis account and usually already has tNIGHT/DUST locally.
    const faucetUrl = process.env.MIDNIGHT_FAUCET_URL?.trim() || LOCAL_CONFIG.faucet;
    if (faucetUrl) {
      try {
        const response = await fetch(`${faucetUrl.replace(/\/$/, '')}/api/v1/faucet/send-test-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: unshieldedAddress }),
        });
        if (!response.ok) {
          console.warn(`Faucet HTTP ${response.status}; continuing deploy anyway.`);
        } else {
          await new Promise((r) => setTimeout(r, 5000));
        }
      } catch (e) {
        console.warn('Faucet unavailable; continuing with genesis-funded dev wallet.', e);
      }
    } else {
      console.log('Skipping faucet (MIDNIGHT_FAUCET_URL not set). Using local genesis wallet seed.');
    }

    const veilClient = await deployVeilContract(providers);
    
    // Save to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = `NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS=${veilClient.contractAddress}\n`;
    fs.writeFileSync(envPath, envContent, { flag: 'w' });

    return NextResponse.json({
      success: true,
      address: veilClient.contractAddress,
      message:
        'Contract deployed. Restart npm run dev so NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS loads from .env.local',
    });
  } catch (error: any) {
    console.error('Deploy error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
