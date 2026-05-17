export const disclosureStates = {
  hidden: 0,
  studentRequested: 1,
  committeeOnly: 2,
} as const;

export type DisclosureStateName = keyof typeof disclosureStates;

export type VeilContractSnapshot = {
  studentCommitment: string;
  proofVerified: boolean;
  latestComplaintHash: string;
  disclosureState: (typeof disclosureStates)[DisclosureStateName];
  caseCounter: number;
};

export const emptyVeilContractSnapshot: VeilContractSnapshot = {
  studentCommitment: "pending",
  proofVerified: false,
  latestComplaintHash: "pending",
  disclosureState: disclosureStates.hidden,
  caseCounter: 0,
};

export function disclosureStateLabel(state: VeilContractSnapshot["disclosureState"]) {
  if (state === disclosureStates.studentRequested) {
    return "student_requested";
  }

  if (state === disclosureStates.committeeOnly) {
    return "committee_only";
  }

  return "hidden";
}

function bytesToHex(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return "pending";
  }

  const hex = `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const isZero = bytes.every((byte) => byte === 0);
  return isZero ? "pending" : hex;
}

export function truncateHex(hex: string, head = 8, tail = 6): string {
  if (hex === "pending" || hex.length <= head + tail + 5) {
    return hex;
  }

  return `${hex.slice(0, head + 2)}...${hex.slice(-tail)}`;
}

export function ledgerToSnapshot(ledger: {
  studentCommitment: Uint8Array;
  proofVerified: boolean;
  latestComplaintHash: Uint8Array;
  disclosureState: bigint;
  caseCounter: bigint;
}): VeilContractSnapshot {
  const studentCommitment = bytesToHex(ledger.studentCommitment);
  const latestComplaintHash = bytesToHex(ledger.latestComplaintHash);
  const disclosureState = Number(ledger.disclosureState);

  return {
    studentCommitment,
    proofVerified: ledger.proofVerified,
    latestComplaintHash,
    disclosureState:
      disclosureState === disclosureStates.studentRequested ||
      disclosureState === disclosureStates.committeeOnly
        ? disclosureState
        : disclosureStates.hidden,
    caseCounter: Number(ledger.caseCounter),
  };
}

export function syncUiFromLedger(ledger: VeilContractSnapshot) {
  return {
    credentialIssued: ledger.studentCommitment !== "pending",
    proofGenerated: ledger.proofVerified,
    revealRequested: ledger.disclosureState >= disclosureStates.studentRequested,
    committeeAccessGranted: ledger.disclosureState === disclosureStates.committeeOnly,
    submitted: ledger.caseCounter > 0,
  };
}
