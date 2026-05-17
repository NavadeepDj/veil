import { NextResponse } from 'next/server';
import { setupVeil, deployVeilContract } from '@/lib/midnight-client';
import fs from 'fs';
import path from 'path';

const seedHex = '0000000000000000000000000000000000000000000000000000000000000001';

export async function GET() {
  try {
    const { wallet, providers } = await setupVeil(seedHex);
    const unshieldedAddress = await (wallet as any).getCoinPublicKey();

    // Ask Faucet for funds
    try {
      await fetch('http://127.0.0.1:8081/api/v1/faucet/send-test-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: unshieldedAddress }),
      });
      // Wait a moment for block to confirm
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.warn('Faucet request failed:', e);
    }

    const veilClient = await deployVeilContract(providers);
    
    // Save to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = `NEXT_PUBLIC_VEIL_CONTRACT_ADDRESS=${veilClient.contractAddress}\n`;
    fs.writeFileSync(envPath, envContent, { flag: 'w' });

    return NextResponse.json({
      success: true,
      address: veilClient.contractAddress,
      message: 'Contract deployed! Restart your dev server to load the new .env.local'
    });
  } catch (error: any) {
    console.error('Deploy error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
