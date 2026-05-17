/** Browser-safe helpers for mock school credential commitments (no PII on-chain). */

export type StudentCredential = {
  credentialId: string;
  commitment: string;
};

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `0x${hash}`;
}

/** Creates a random credential id and a 32-byte commitment (never includes student PII). */
export async function issueStudentCredential(): Promise<StudentCredential> {
  const credentialId = crypto.randomUUID();
  const commitment = await sha256Hex(`veil-student-credential:${credentialId}`);
  return { credentialId, commitment };
}

/** Deterministic credential derived from verified student id (no PII in commitment input). */
export async function issueStudentCredentialFromId(studentId: string): Promise<StudentCredential> {
  const safeId = studentId.trim() || "student";
  const commitment = await sha256Hex(`veil-student-eligibility:${safeId}`);
  return { credentialId: `student-${safeId}`, commitment };
}
