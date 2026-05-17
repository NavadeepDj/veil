import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  registerStudentCommitment(context: __compactRuntime.CircuitContext<PS>,
                            commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  logComplaint(context: __compactRuntime.CircuitContext<PS>,
               complaintHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  requestReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  approveCommitteeReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerStudentCommitment(context: __compactRuntime.CircuitContext<PS>,
                            commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  logComplaint(context: __compactRuntime.CircuitContext<PS>,
               complaintHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  requestReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  approveCommitteeReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerStudentCommitment(context: __compactRuntime.CircuitContext<PS>,
                            commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  logComplaint(context: __compactRuntime.CircuitContext<PS>,
               complaintHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  requestReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  approveCommitteeReveal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly studentCommitment: Uint8Array;
  readonly proofVerified: boolean;
  readonly latestComplaintHash: Uint8Array;
  readonly disclosureState: bigint;
  readonly caseCounter: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
