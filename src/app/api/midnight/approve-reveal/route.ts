import { ensureConfigured, midnightErrorResponse, runMidnightAction } from '@/lib/midnight-route-utils';
import { getVeilClient } from '@/lib/veil-session';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST() {
  const notReady = await ensureConfigured();
  if (notReady) {
    return notReady;
  }

  try {
    const client = await getVeilClient();
    return runMidnightAction(() => client.approveCommitteeReveal());
  } catch (error) {
    return midnightErrorResponse(error);
  }
}
