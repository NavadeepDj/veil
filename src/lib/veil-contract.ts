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
