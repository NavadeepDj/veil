import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { disclosureStateLabel, disclosureStates, emptyVeilContractSnapshot } from "@/lib/veil-contract";

describe("Veil Midnight contract shape", () => {
  it("keeps disclosure state labels aligned with the UI", () => {
    expect(disclosureStateLabel(disclosureStates.hidden)).toBe("hidden");
    expect(disclosureStateLabel(disclosureStates.studentRequested)).toBe("student_requested");
    expect(disclosureStateLabel(disclosureStates.committeeOnly)).toBe("committee_only");
  });

  it("starts from a privacy-preserving empty snapshot", () => {
    expect(emptyVeilContractSnapshot).toEqual({
      studentCommitment: "pending",
      proofVerified: false,
      latestComplaintHash: "pending",
      disclosureState: disclosureStates.hidden,
      caseCounter: 0,
    });
  });

  it("does not define raw sensitive fields in the public Compact ledger", () => {
    const contractPath = path.join(process.cwd(), "contracts", "veil.compact");
    const contract = readFileSync(contractPath, "utf8");
    const publicInterface = contract
      .split("\n")
      .filter((line) => line.trim().startsWith("export ledger") || line.trim().startsWith("export circuit"))
      .join("\n");

    expect(contract).toContain("export ledger studentCommitment");
    expect(contract).toContain("export ledger latestComplaintHash");
    expect(contract).toContain("export ledger disclosureState");

    for (const forbidden of [
      "rawComplaint",
      "complaintText",
      "studentName",
      "rollNumber",
      "email",
      "phone",
      "evidence",
      "walletIdentity",
    ]) {
      expect(publicInterface).not.toContain(forbidden);
    }
  });
});
